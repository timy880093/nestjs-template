import { Injectable } from '@nestjs/common';
import paymentConfig from '../payment.config';
import crypto from 'crypto';
import qs from 'querystring';
import { NewebpayReq } from '../dto/newebpay/newebpay.req';
import { PaymentException } from '@app/common/exception/payment.exception';
import { PaymentRes } from '../dto/payment.res';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaymentReq } from '../dto/payment.req';
import { PaymentGateway } from './payment.gateway';
import { PaymentLinkRes } from '../dto/payment-link.res';
import { CryptoUtil } from '@app/common/util/crypto.util';
import { NewebpayNotifyReq } from '../dto/newebpay/newebpay-notify.req';
import { NewebpayNotifyRes } from '../dto/newebpay/newebpay-notify.res';
import { UpdatePaymentReq } from '../dto/update-payment.req';
import { NewebpayBuilder } from '../util/newebpay-builder';
import { CancelPaymentReq } from '../dto/cancel-payment.req';
import { CancelPaymentRes } from '../dto/cancel-payment.res';

@Injectable()
export class NewebpayAdapter implements PaymentGateway {
  private readonly hashKey: string;
  private readonly hashIV: string;
  private readonly merchantID: string;
  private readonly version: string;
  private readonly url: string;
  private readonly notifyURL: string;
  private readonly returnURL: string;

  constructor(
    @InjectPinoLogger(NewebpayAdapter.name)
    private readonly logger: PinoLogger,
  ) {
    const config = paymentConfig().newebpay;
    this.hashKey = config.hashKey;
    this.hashIV = config.hashIV;
    this.merchantID = config.merchantID;
    this.version = config.version;
    this.url = config.url;
    this.notifyURL = config.notifyURL;
    this.returnURL = config.returnURL;
    this.logger.debug({ config }, 'NewebpayAdapter initialized');
  }

  private createTradeInfoStr({
    tradeNo,
    totalAmount,
    product,
    email,
    returnURL,
    notifyURL,
  }: PaymentReq): string {
    const tradeInfo = {
      MerchantID: this.merchantID,
      RespondType: 'JSON',
      TimeStamp: new Date().getTime(),
      Version: this.version,
      MerchantOrderNo: tradeNo,
      Amt: totalAmount,
      ItemDesc: product,
      Email: email,
      NotifyURL: notifyURL || this.notifyURL,
      ReturnURL: returnURL || this.returnURL, // 優先使用業務邏輯傳的
    };
    return qs.stringify(tradeInfo);
  }

  private encryptTradeInfo(urlParamsString: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      this.hashKey,
      this.hashIV,
    );
    let encrypted = cipher.update(urlParamsString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptTradeInfo(encrypted: string): NewebpayNotifyRes {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.hashKey,
        this.hashIV,
      );
      decipher.setAutoPadding(false);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const result = decrypted.replace(/[\x00-\x20]+/g, '');
      return new NewebpayNotifyRes(JSON.parse(result));
    } catch (e) {
      throw new PaymentException(`tradeInfo parse error: ${e.message}`);
    }
  }

  private hashTradeInfo(encrypted: string): string {
    return CryptoUtil.generateSha256Hash(
      `HashKey=${this.hashKey}&${encrypted}&HashIV=${this.hashIV}`,
      true,
    );
  }

  private validateHash(tradeInfoEncrypted: string, tradeSha: string): boolean {
    return this.hashTradeInfo(tradeInfoEncrypted) === tradeSha;
  }

  // parsePaymentResult({
  //   TradeInfo: tradeInfoEncrypted,
  //   TradeSha: tradeSha,
  // }: NewebpayNotifyReq): PaymentRes {
  //   try {
  //     if (!this.compareHash(tradeInfoEncrypted, tradeSha)) {
  //       throw new PaymentException('tradeInfo hash is not match');
  //     }
  //     // payment
  //     const tradeInfo = this.decryptTradeInfo(tradeInfoEncrypted);
  //     this.logger.debug('tradeInfo: ', tradeInfo);
  //
  //     const {
  //       Status: paymentStatus,
  //       Message: message,
  //       Result: paymentData,
  //     } = tradeInfo;
  //     this.logger.debug({ paymentData }, 'parseResult: ');
  //     const tradeNo = paymentData.MerchantOrderNo || '';
  //     const price = paymentData.Amt || 0;
  //     const status =
  //       paymentStatus === 'SUCCESS' && tradeNo
  //         ? PaymentStatusEnum.SUCCESSFUL
  //         : PaymentStatusEnum.FAILED;
  //     const error = paymentStatus === 'SUCCESS' ? null : message;
  //
  //     return new PaymentRes({ tradeNo, status, error });
  //   } catch (e) {
  //     e.message = `parse payment result error: ${e.message}`;
  //     throw e;
  //   }
  // }

  parsePaymentReturnResult(req: NewebpayNotifyReq): PaymentRes {
    return this.parsePaymentResult(req);
  }

  parsePaymentNotifyResult(req: NewebpayNotifyReq): PaymentRes {
    return this.parsePaymentResult(req);
  }

  private parsePaymentResult({
    TradeInfo: tradeInfoEncrypted,
    TradeSha: tradeSha,
  }: NewebpayNotifyReq): PaymentRes {
    try {
      if (!this.validateHash(tradeInfoEncrypted, tradeSha)) {
        throw new PaymentException('tradeInfo hash is not match');
      }
      try {
        const newebpayNotifyRes = this.decryptTradeInfo(tradeInfoEncrypted);
        this.logger.debug({ newebpayNotifyRes }, 'newebpayNotifyRes: ');
        return NewebpayBuilder.toPaymentRes(newebpayNotifyRes);
      } catch (e) {
        throw new PaymentException(`tradeInfo parse error: ${e.message}`);
      }
    } catch (e) {
      e.message = `parsePaymentResult() error: ${e.message}`;
      throw e;
    }
  }

  genPaymentHtml(data: NewebpayReq): string {
    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <body>

    <form id="paymentForm" method="post" action="${data.Url}" style="display: none;">
        MID: <input name="MerchantID" value="${data.MerchantID}" readonly><br>
        Version: <input name="Version" value="${data.Version}" readonly><br>
        TradeInfo: <input name="TradeInfo" value="${data.TradeInfo}" readonly><br>
        TradeSha: <input name="TradeSha" value="${data.TradeSha}" readonly><br>
        <input type="submit">
    </form>

    <script>
      document.getElementById('paymentForm').submit(); // Submit the form automatically
    </script>

    </body>
    </html>
  `;
  }

  async paymentData(paymentReq: PaymentReq): Promise<NewebpayReq> {
    this.logger.debug({ paymentReq }, 'paymentData: ');
    const tradeInfoStr = this.createTradeInfoStr(paymentReq);
    const encrypted = this.encryptTradeInfo(tradeInfoStr);
    return new NewebpayReq({
      Url: this.url,
      MerchantID: this.merchantID,
      Version: this.version,
      TradeInfo: encrypted,
      TradeSha: this.hashTradeInfo(encrypted),
    });
  }

  async paymentLink(paymentReq: PaymentReq): Promise<PaymentLinkRes> {
    const newebpayData = await this.paymentData(paymentReq);
    const html = this.genPaymentHtml(newebpayData);
    return new PaymentLinkRes({ html });
  }

  async update(req: UpdatePaymentReq): Promise<PaymentRes> {
    throw new PaymentException('Method not implemented.');
  }

  async cancel(req: CancelPaymentReq): Promise<CancelPaymentRes> {
    throw new PaymentException('Method not implemented.');
  }
}
