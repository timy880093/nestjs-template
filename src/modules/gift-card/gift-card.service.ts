import { Injectable } from '@nestjs/common';
import { DateUtil } from 'src/common/util/date.util';
import {
  PaymentNotifyReq,
  PaymentReturnReq,
} from 'src/third-party/payment/dto/payment-notify.type';
import {
  PaymentProviderEnum,
  PaymentStatusEnum,
} from 'src/third-party/payment/dto/payment.enum';
import { PaymentReq } from 'src/third-party/payment/dto/payment.req';
import { PaymentService } from 'src/third-party/payment/payment.service';
import { ItemRepository } from '../item/item.repository';
import { GiftCardRepository } from './gift-card.repository';

import { ErrorTypes } from 'src/common/dto/error-code.const';

import { Sequelize } from 'sequelize-typescript';
import { PaymentRes } from 'src/third-party/payment/dto/payment.res';

import { PinoLogger } from 'nestjs-pino';
import { TransactionBuilder } from 'src/modules/ticket/utils/transaction-builder';
import { InvoiceService } from 'src/third-party/invoice/invoice.service';
import { GiftCardOrderDto } from './dto/gift-card-order.dto';

import fs from 'fs/promises';
import path from 'path';
import { GiftCardException } from 'src/common/exception/giftcard.exception';
import { NewTransactionService } from 'src/modules/new-transaction/new-transaction.service';
import { TransactionStatusEnum } from 'src/modules/new-transaction/transaction-status.enum';
import { UsersService } from 'src/modules/users/users.service';
import paymentConfig from 'src/third-party/payment/payment.config';
import { ItemCategoryEnum } from '../item/item.enum';
import { GiftCardStatusEnum } from './dto/gift-card-status.enum';
import { GiftCardOrderModel } from './entity/gift-card-order.model';

// import html_to_pdf from 'html-pdf-node';
import { SendMailTemplateReq } from 'src/third-party/mail/dto/send-mail-template.req';
import { NewebpayReq } from 'src/third-party/payment/dto/newebpay/newebpay.req';
import { GiftCardModel } from './entity/gift-card.model';
import puppeteer from 'puppeteer';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { MailLogService } from '../mail-log/mail-log.service';
import { MailLogCategory } from '../mail-log/dto/mail-log.enum';
import { CouponTypeEnum } from '../ticket/enums/coupon-type.enum';
import { MailLogDto } from '../mail-log/dto/mail-log.dto';
import { AdminException } from '../../common/exception/admin.exception';
import { CreateGiftCardRes } from '../admin/dto/create-gift-card.dto';

@Injectable()
export class GiftCardService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly sequelize: Sequelize,
    private readonly giftCardRepository: GiftCardRepository,
    private readonly itemRepository: ItemRepository,
    private readonly paymentService: PaymentService,
    private readonly transactionService: NewTransactionService,
    private readonly mailLogService: MailLogService,
    private readonly invoiceService: InvoiceService,
    private readonly usersService: UsersService,
  ) {}

  private templates = {};

  async onModuleInit(): Promise<void> {
    await this.loadTemplates();
  }

  public async payment(dto: GiftCardOrderDto) {
    const config = paymentConfig().newebpay;
    const notifyURL = config.giftCardNotifyURL;
    const returnURL = config.giftCardReturnURL;

    const { name, phone, email, itemId, ref } = dto;
    const { order, giftCards } = await this.createGiftCardWithOrder(dto);
    const item = await this.itemRepository.findOne({
      id: itemId,
      category: ItemCategoryEnum.GIFT_CARD,
    });

    const user = await this.usersService.findOrCreate({ email, phone, ref });

    const paymentReq: PaymentReq = {
      totalAmount: item.amount,
      tradeNo: order.tradeNo,
      username: name,
      userUuid: user.uuid,
      phone,
      email,
      product: item.name,
      totalAmountPaid: item.amount,
      timesPaid: 1,
    };

    const transaction = await this.transactionService.create({
      rawRequest: paymentReq,
      tradeNo: order.tradeNo,
      status: TransactionStatusEnum.PRE_ISSUE,
    });

    order.transactionId = transaction.id;
    await order.save();
    return this.paymentService.paymentData(PaymentProviderEnum.NEWEBPAY, {
      ...paymentReq,
      returnURL,
      notifyURL,
    });
  }

  // 大小寫模糊，尚未過期的，未使用的
  public async getGiftCardByCode(code: string, category?: ItemCategoryEnum) {
    return this.giftCardRepository.findOneGiftCardBy(
      { code: { [Op.iLike]: code } },
      true,
    );
  }

  public async getGiftCardById(id: number, transaction?: Transaction) {
    return this.giftCardRepository.findOneGiftCardBy(
      { id },
      false,
      transaction,
    );
  }

  async getAllGiftCards(
    where: WhereOptions<GiftCardModel>,
    transaction?: Transaction,
  ) {
    return this.giftCardRepository.findAllGiftCards(where, transaction);
  }

  public async getGiftCardAllItem() {
    return this.itemRepository.findAll({
      category: ItemCategoryEnum.GIFT_CARD,
    });
  }

  public async getGiftCardItemById(itemId: number) {
    return this.itemRepository.findOne({
      category: ItemCategoryEnum.GIFT_CARD,
      id: itemId,
    });
  }

  private async createGiftCardWithOrder(
    orderInfo: GiftCardOrderDto,
  ): Promise<{ order: GiftCardOrderModel; giftCards: GiftCardModel[] }> {
    const { itemId, ref } = orderInfo;
    const transaction = await this.sequelize.transaction();

    try {
      const item = await this.itemRepository.findOne({ id: itemId });
      const order = await this.giftCardRepository.createGiftCardOrder(
        orderInfo,
        item,
        transaction,
      );
      const orderDetail =
        await this.giftCardRepository.createGiftCardOrderDetail(
          {
            orderId: order.id,
            itemId: item.id,
            itemCount: 1,
          },
          transaction,
        );
      const giftCards = await this.createGiftCards(
        {
          orderDetailId: orderDetail.id,
          expiredAt: DateUtil.addDateIncrement('100y'),
          value: 100,
          type: CouponTypeEnum.PERCENTAGE,
          ref,
        },
        item.count,
        transaction,
      );

      await transaction.commit();
      return { order, giftCards };
    } catch (e) {
      await transaction.rollback();
      throw new GiftCardException(
        'createGiftCardOrder failed',
        ErrorTypes.SERVER_ERROR,
      );
    }
  }

  async paymentNotify(result: PaymentNotifyReq): Promise<void> {
    const paymentRes = this.paymentService.parsePaymentNotifyResult(result);

    if (!paymentRes)
      throw new GiftCardException(
        `paymentNotify failed: parsePaymentResult failed`,
      );

    const giftCardOrder = await this.giftCardRepository.findOneOrder({
      tradeNo: paymentRes.tradeNo,
    });

    const transaction = await this.transactionService.findOne({
      id: giftCardOrder.transactionId,
    });

    transaction.rawResponse = result;
    await transaction.save();

    if (!giftCardOrder)
      throw new GiftCardException(
        `tradeNo(${paymentRes.tradeNo}) Order not found`,
        ErrorTypes.NOT_FOUND,
      );

    if (paymentRes.status === PaymentStatusEnum.SUCCESSFUL) {
      giftCardOrder.status = GiftCardStatusEnum.SUCCESSFUL;
      await giftCardOrder.save();
    }

    await this.paymentNotifyInvoice(paymentRes);
  }

  async paymentNotifyInvoice(paymentRes: PaymentRes): Promise<void> {
    try {
      // const orderDto = await this.createGiftCardOrder(paymentRes);
      if (paymentRes.status === PaymentStatusEnum.SUCCESSFUL)
        await this.issueInvoice(paymentRes.tradeNo);
    } catch (e) {
      throw new GiftCardException(
        `tradeNo(${paymentRes.tradeNo}) paymentNotify failed: ${e.message}`,
        ErrorTypes.SERVER_ERROR,
      );
    }
  }

  async issueInvoice(tradeNo: string): Promise<any> {
    try {
      const order = await this.giftCardRepository.findOneOrder({
        tradeNo,
      });
      if (!order)
        throw new GiftCardException(
          `tradeNo(${tradeNo}) Order not found`,
          ErrorTypes.NOT_FOUND,
        );
      const invoiceRes = await this.invoiceService.issue(
        TransactionBuilder.buildEzpayReq({
          email: order.email,
          tradeNo: order.tradeNo,
          totalAmount: order.amount,
          product: order.orderDetails[0].item.name,
          username: order.userName,
        }),
      );
      const { status, invoiceNo, invoiceRandomNo, invoiceAt, error } =
        invoiceRes;
      const twInvoiceAt =
        status === PaymentStatusEnum.SUCCESSFUL && (invoiceAt || new Date());

      const transactionResult = await this.transactionService.update(
        { tradeNo },
        {
          rawInvoice: invoiceRes,
          invoiceNo,
          invoiceRandomNo,
          invoiceAt: twInvoiceAt,
          invoiceError: error,
        },
      );
      this.logger.debug(
        { tradeNo, invoiceNo, invoiceRandomNo, invoiceAt },
        'issueInvoice update transaction OK: ',
      );
      if (status === PaymentStatusEnum.FAILED) {
        this.logger.warn(
          { error },
          `tradeNo(${tradeNo}) issueInvoice failed: `,
        );
        // TODO send email
      }
      return {
        tradeNo,
        error,
        transactionDto: error ? null : transactionResult,
      };
    } catch (e) {
      // 不拋出錯誤，因為發票失敗不影響交易
      this.logger.warn(
        { message: e.message },
        `tradeNo(${tradeNo}), issueInvoice error: `,
      );
    }
  }

  async getPaymentReturnUrl(result: PaymentReturnReq): Promise<string> {
    try {
      // const { tradeNo, status } =
      //   this.paymentService.parsePaymentResult2(result);
      const paymentRes = this.paymentService.parsePaymentReturnResult(result);
      this.logger.debug({ paymentRes }, 'getPaymentReturnUrl: ');
      const { tradeNo, status } = paymentRes;
      const giftCards = await this.giftCardRepository.findGiftCardsByOrder({
        tradeNo,
      });
      const order = await this.giftCardRepository.findOneOrder({ tradeNo });
      const orderTransaction = await this.transactionService.findOne({
        id: order.transactionId,
      });

      try {
        await this.sendGiftCardEmail(
          giftCards.map((g) => g.code),
          order.email,
          order.tradeNo,
          order.createdAt,
        );
      } catch (error) {
        this.logger.warn(
          { message: error.message },
          'getPaymentReturnUrl error: ',
        );
      }

      // TODO 訂單狀態要跟發票一致
      order.status = GiftCardStatusEnum.SUCCESSFUL;
      await order.save();

      status === PaymentStatusEnum.SUCCESSFUL
        ? (orderTransaction.status = TransactionStatusEnum.ISSUE)
        : (orderTransaction.status = TransactionStatusEnum.ISSUE_FAILED);
      await orderTransaction.save();
      if (!giftCards)
        throw new GiftCardException(
          `tradeNo(${tradeNo}) Gift Card not found`,
          ErrorTypes.NOT_FOUND,
        );

      return this.parseReturnURL(
        giftCards.map((c) => c.code),
        order.orderDetails[0].itemId,
        status,
      );
    } catch (e) {
      // AFTEE 付款頁按 X 會導致異常，返回待付款清單頁
      this.logger.warn({ message: e.message }, 'getPaymentReturnUrl error: ');
      return paymentConfig().common.giftCardDefaultReturnPage;
    }
  }

  private parseReturnURL(
    code: string[],
    itemId: number,
    status: PaymentStatusEnum,
  ): string {
    let url: string;

    url =
      status === PaymentStatusEnum.SUCCESSFUL
        ? paymentConfig().common.giftCardSuccessReturnPage
        : paymentConfig().common.giftCardErrorReturnPage;
    url = url.replace(':code', code.join(','));
    url = url.replace(':productId', itemId.toString());

    return url;
  }

  private async loadTemplates() {
    const planAPath = path.join(
      __dirname,
      './modules/gift-card/templates/gift-card-planA-template.html',
    );
    const planBPath = path.join(
      __dirname,
      './modules/gift-card/templates/gift-card-planB-template.html',
    );

    const planATemplate = await fs.readFile(planAPath, 'utf8');
    const planBTemplate = await fs.readFile(planBPath, 'utf8');
    this.templates['planATemplate'] = planATemplate;
    this.templates['planBTemplate'] = planBTemplate;
  }

  public async sendGiftCardEmail(
    codeList: string[],
    email: string,
    orderNo: string,
    createdAt: Date,
  ) {
    const data = {
      giftCardCodes: codeList,
      orderNo,
      createdAt: createdAt.toISOString().split('T')[0],
    };
    const templateType =
      codeList.length === 5 ? 'planATemplate' : 'planBTemplate';

    const html = this.renderTemplate(this.templates[templateType], data);

    const _htmlToPdf = await this.htmlToPdf(html, templateType);

    const output = _htmlToPdf;

    return this.mailLogService.sendTemplate(
      new SendMailTemplateReq({
        to: email,
        subject: `罰單申訴.com 親送專屬於您的禮物卡，無懼罰單享受安心駕駛`,
        template: 'gift-card-edm',
        tag: 'gift-card',
        attachments: [
          {
            content: output,
            filename:
              templateType === 'planATemplate'
                ? '罰單免來  禮物卡（4+1 組）.pdf'
                : '罰單剋星  禮物卡（8+1 組）.pdf',
          },
        ],
      }),
      MailLogCategory.GIFT_CARD,
    );
  }

  private renderTemplate = (template, variables) => {
    const templateFunction = new Function(
      ...Object.keys(variables),
      `return \`${template}\`;`,
    );
    return templateFunction(...Object.values(variables));
  };

  private async htmlToPdf(html, templateType) {
    const planAOptions = {
      printBackground: true,
      height: '1525px',
      width: '650px',
    };
    const planBOptions = {
      printBackground: true,
      height: '1837px',
      width: '650px',
    };

    const options =
      templateType === 'planATemplate' ? planAOptions : planBOptions;
    // Example of options with args //
    // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

    const file = { content: html };

    const output = await this.generatePdf(file, options);
    return output;
  }

  public genPaymentHtml(data: NewebpayReq): string {
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

  async generatePdf(file, options) {
    let args = ['--no-sandbox', '--disable-setuid-sandbox'];
    if (options.args) {
      args = options.args;
      delete options.args;
    }
    const browser = await puppeteer.launch({
      args: args,
    });
    const page = await browser.newPage();

    // We set the page content as the generated html by handlebars
    await page.setContent(file.content, {
      waitUntil: 'networkidle0', // wait for page to load completely
    });
    const result = await page.pdf(options);

    await browser.close();

    return Buffer.from(Object.values(result));
  }

  async updateToUsed(id: number[], transaction: Transaction) {
    if (id.length > 0)
      await this.giftCardRepository.updateBulk(
        { id },
        { usedAt: new Date() },
        transaction,
      );
  }

  public async createGiftCards(
    data: Partial<GiftCardModel>,
    count: number,
    transaction?: Transaction,
  ) {
    return Promise.all(
      Array(count)
        .fill(null)
        .map(() => this.giftCardRepository.createGiftCard(data, transaction)),
    );
  }

  async createGiftCardWithoutOrder(
    giftCardModel: Partial<GiftCardModel>,
    count: number,
  ): Promise<CreateGiftCardRes> {
    let codes = [];
    const transaction = await this.sequelize.transaction();
    try {
      const results = await this.createGiftCards(
        giftCardModel,
        count,
        transaction,
      );

      codes = results.map((g) => g.code);
      await transaction.commit();
      this.logger.debug({ codes }, 'createGiftCard: ');
      return { count, codes };
    } catch (e) {
      await transaction.rollback();
      throw new AdminException(
        'createGiftCardWithoutOrder failed',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async resendGiftCardEmail(
    email: string,
    tradeNo: string,
    createdAt?: Date,
  ): Promise<MailLogDto> {
    if (!createdAt) createdAt = new Date();
    const giftCards = await this.giftCardRepository.findGiftCardsByOrder({
      tradeNo,
    });
    return this.sendGiftCardEmail(
      giftCards.map((g) => g.code),
      email,
      tradeNo,
      createdAt,
    );
  }
}
