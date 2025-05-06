import axios from 'axios';
import { PaymentException } from '@app/common/exception/payment.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaymentGateway } from './payment.gateway';
import { Injectable } from '@nestjs/common';
import paymentConfig from '../payment.config';
import { AfteeBuilder } from '../util/aftee-builder';
import { ValidatorUtil } from '@app/common/util';
import {
  AfteeNotifyReq,
  AfteePreRegisterRes,
  AfteeReturnReq,
} from '../dto/aftee';
import {
  CancelPaymentReq,
  CancelPaymentRes,
  PaymentLinkRes,
  PaymentReq,
  PaymentRes,
  UpdatePaymentReq,
} from '../dto';

@Injectable()
export class AfteeAdapter implements PaymentGateway {
  private readonly preRegisterURL: string;
  private readonly shopPublicKey: string;
  private readonly shopSecretKey: string;
  private readonly paymentURL: string;
  private readonly returnURL: string;
  private readonly updateURL: string;
  private readonly cancelURL: string;

  constructor(
    @InjectPinoLogger(AfteeAdapter.name)
    private readonly logger?: PinoLogger,
  ) {
    const afteeConfig = paymentConfig().aftee;
    this.shopPublicKey = afteeConfig.shopPublicKey;
    this.shopSecretKey = afteeConfig.shopSecretKey;
    this.preRegisterURL = afteeConfig.preRegisterURL;
    this.paymentURL = afteeConfig.paymentURL;
    this.returnURL = afteeConfig.returnURL;
    this.updateURL = afteeConfig.updateURL;
    this.cancelURL = afteeConfig.cancelURL;
    this.logger.debug({ config: afteeConfig }, 'AfteeAdapter initialized');
  }

  parsePaymentNotifyResult(result: AfteeNotifyReq): PaymentRes {
    return AfteeBuilder.buildPaymentResForNotify(result);
  }

  parsePaymentReturnResult(result: AfteeReturnReq): PaymentRes {
    return AfteeBuilder.buildPaymentResForReturn(result);
  }

  async paymentData(req: PaymentReq): Promise<AfteePreRegisterRes> {
    try {
      this.logger.debug({ paymentReq: req }, 'aftee paymentReq: ');
      const returnURL = req.returnURL || this.returnURL;
      // this.logger.debug({ returnURL }, 'paymentReq returnURL: ');

      const paymentData = {
        amount: req.totalAmount,
        shop_transaction_no: req.tradeNo,
        user_no: req.userUuid,
        sales_settled: true, //是否自動確認交易
        transaction_options: [6], // for 二次付款做關聯
        // description_trans: '',
        // checksum: 'w7qp7XsEQoF9FEGxgdjhZNHUgHx6vTaSGnWE/DGReHw=',
        customer: {
          customer_name: req.username,
          phone_number: this.parsePhone(this.preRegisterURL, req.phone),
          address: '',
          email: req.email,
          additional_info_code: this.genAdditionalInfoCode(
            req.totalAmountPaid,
            req.timesPaid,
          ),
        },
        // dest_customers: [
        //   {
        //     dest_customer_name: 'haha',
        //     dest_address: 'test addr',
        //     dest_tel: '0900000000',
        //   },
        // ],
        items: [
          {
            shop_item_id: 'appeal-service-fee',
            item_name: req.product,
            item_category: 'service',
            item_price: req.totalAmount,
            item_count: 1,
          },
        ],
        // validation_datetime: DateUtil.twDayjs().format('YYYY-MM-DD HH:mm:ss'), //結帳模組失效時間。如果不設定，結帳模組預設 24 小時後失效，'2024-04-05 12:00:00'
        return_url: returnURL, // 優先使用業務邏輯傳的
      };
      // this.logger.debug({ paymentData }, 'paymentData: ');

      // const checksum = this.genChecksum(paymentData, this.shopSecretKey);
      const checksumData = AfteeBuilder.parseChecksumData(paymentData);
      this.logger.debug({ checksumData }, 'checksumData: ');

      const checksum = AfteeBuilder.generateChecksum(
        checksumData,
        this.shopSecretKey,
      );
      this.logger.debug({ checksum }, 'checksum: ');

      const response = await axios.post(this.preRegisterURL, {
        pre_token: '',
        pub_key: this.shopPublicKey,
        payment: { ...paymentData, checksum },
      });
      return AfteeBuilder.buildPreRegisterRes(response.data);
    } catch (err) {
      throw new PaymentException(`preRegister error: ${err.message}`);
    }
  }

  async paymentLink(req: PaymentReq): Promise<PaymentLinkRes> {
    const { isSuccessful, shopTransactionNo, preRegisterIdentifier } =
      await this.paymentData(req);
    if (!isSuccessful) throw new PaymentException('preRegister failed');
    const url = `${this.paymentURL}/${shopTransactionNo}?identifier=${preRegisterIdentifier}`;
    this.logger.debug(
      { isSuccessful, shopTransactionNo, preRegisterIdentifier },
      'paymentLink: ',
    );
    return new PaymentLinkRes({ url });
  }

  private genAdditionalInfoCode(amount: number, count: number): string {
    return (
      this.genFirstAdditionalInfoCode(amount) +
      this.genSecondAdditionalInfoCode(count)
    );
  }

  // 累計購買金額
  private genFirstAdditionalInfoCode(amount: number): string {
    if (amount <= 0) return 'A';
    if (amount <= 2000) return 'B';
    if (amount <= 5000) return 'C';
    if (amount <= 10000) return 'D';
    if (amount <= 20000) return 'E';
    if (amount <= 30000) return 'F';
    if (amount <= 50000) return 'G';
    if (amount <= 75000) return 'H';
    if (amount <= 100000) return 'I';
    return 'J';
  }

  private genSecondAdditionalInfoCode(count: number): string {
    if (count <= 0) return 'A';
    if (count <= 1) return 'B';
    if (count <= 5) return 'C';
    if (count <= 10) return 'D';
    if (count <= 15) return 'E';
    if (count <= 20) return 'F';
    if (count <= 30) return 'G';
    if (count <= 50) return 'H';
    if (count <= 100) return 'I';
    return 'J';
  }

  private preRegister(): void {}

  private register(): void {}

  query(): void {}

  async update(req: UpdatePaymentReq): Promise<PaymentRes> {
    await ValidatorUtil.validate(req);
    return this.updateForSecond(req);
  }

  // 二次交易更新，與普通交易更新稍微不同，有金額限制 3000~5000，只能執行一次，之後會 400
  protected async updateForSecond(req: UpdatePaymentReq): Promise<PaymentRes> {
    // 不能加 updated_transactions，否則第一筆會被取消！除非是總共要收這個金額(包含第一次)
    const data = {
      // updated_transactions: req.providerTradeNo,
      authentication_token: req.parseToken(),
      amount: req.totalAmount,
      shop_transaction_no: req.tradeNo,
      user_no: req.userUuid,
      sales_settled: true,
      transaction_options: [6],
      primary_transaction_ids: [req.providerTradeNo],
      // description_trans: '',
      customer: {
        customer_name: req.username,
        phone_number: this.parsePhone(this.preRegisterURL, req.phone),
        address: '',
        email: req.email,
        additional_info_code: this.genAdditionalInfoCode(
          req.totalAmountPaid,
          req.timesPaid,
        ),
      },
      // dest_customers: [
      //   {
      //     dest_customer_name: 'haha',
      //     dest_address: '104台北市中山區復興北路378號5樓',
      //     dest_tel: '0900000000',
      //   },
      // ],
      items: [
        {
          shop_item_id: 'appeal-success-fee',
          item_name: req.product,
          item_category: 'service',
          item_price: req.totalAmount,
          item_count: 1,
        },
      ],
    };

    // this.logger.debug({ data }, 'update aftee body: ');
    try {
      const response = await axios.post(this.updateURL, data, {
        headers: this.commonHeaders(this.shopSecretKey),
      });
      // this.logger.debug(
      //   { response: response.data },
      //   'updateForSecond response: ',
      // );

      return this.parseUpdateResponse(
        new AfteeNotifyReq(response.data),
      ) as PaymentRes;
    } catch (e) {
      throw new PaymentException(`aftee update api error: ${e.message}`);
    }
  }

  protected parseUpdateResponse(result: AfteeNotifyReq): PaymentRes {
    return AfteeBuilder.buildPaymentResForNotify(result);
  }

  async cancel(req: CancelPaymentReq): Promise<CancelPaymentRes> {
    await ValidatorUtil.validate(req);
    const cancelURL = this.cancelURL.replace(':id', req.id);
    this.logger.debug({ cancelURL }, 'cancel aftee: ');
    try {
      const authToken = btoa(`${this.shopSecretKey}:`);
      const { data } = await axios.patch(cancelURL, null, {
        // headers: this.commonHeaders(this.shopSecretKey),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
      });
      this.logger.debug({ data }, 'cancel response: ');
      return AfteeBuilder.buildCancelPaymentRes(data as AfteeNotifyReq);
    } catch (e) {
      throw new PaymentException(`cancel api error: ${e.message}`);
    }
  }

  private commonHeaders(shopSecretKey: string): any {
    const authToken = btoa(`${shopSecretKey}:`);
    return {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authToken}`,
    };
  }

  private parsePhone(url: string, phone: string): string {
    // 測試機用固定號碼
    return url.startsWith('https://ct-') ? '0909999981' : phone;
  }
}
