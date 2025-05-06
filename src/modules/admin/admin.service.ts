import { Injectable } from '@nestjs/common';
import { GetTrackEventReq, StatisticService } from '../statistic';
import { TicketAppealService } from '../ticket/shared/ticket-appeal.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Sequelize } from 'sequelize-typescript';
import { MqService } from '../../third-party/mq/mq.service';
import { Job } from 'bullmq';
import { MqEnum } from '../../third-party/mq/mq.enum';
import { OrderDto } from '../ticket/dto/order.dto';
import { TicketException } from '../../common/exception/ticket.exception';
import { SendMailTemplateReq } from '../../third-party/mail/dto/send-mail-template.req';
import { ProgressEnum } from '../ticket/enums/order.enum';
import { AdminException } from '../../common/exception/admin.exception';
import { CommonUtil, DateUtil } from '../../common/util';
import {
  AdminSecondPaymentReq,
  BotStatusUpdateReqDto,
  ProgressMailDto,
  SendFreeGiftCardEdmDto,
  SendProgressMailReq,
  TicketSubmissionUpdateReqDto,
  UpdateToCompletedReq,
  UpdateToProcessingReq,
  UpdateToSubmittedReq,
} from './dto';
import { TicketSubmissionDto } from '../ticket/dto/ticket-submission.dto';
import { NotfoundException } from '../../common/exception/notfound.exception';
import { AppealResultEnum } from '../ticket/enums/ticket.enum';
import { OrderService } from '../ticket/service/order.service';
import { TicketImportService } from '../ticket/shared/ticket-import.service';
import { PaymentProviderEnum } from '../../third-party/payment/dto';
import paymentConfig from '../../third-party/payment/payment.config';
import { OrderSecondPriceDto } from '../ticket/dto/order-price.dto';
import appConfig from '../../config/app.config';
import { TransactionCancelReq } from '../ticket/dto/transaction-cancel.req';
import { TransactionService } from '../ticket/service/transaction.service';
import ticketConfig from '../ticket/ticket.config';
import { ProgressEmailDto } from '../ticket/dto/progress-email.dto';
import { ExtraApprovedInfoDto } from '../../third-party/mail/dto/extra-approved-info.dto';
import { TicketDto } from '../ticket/dto/ticket.dto';
import { TicketSubmissionService } from '../ticket/service/ticket-submission.service';
import { TicketService } from '../ticket/service/ticket.service';
import { MailLogService } from '../mail-log/mail-log.service';
import { MailLogCategory } from '../mail-log/dto/mail-log.enum';
import { GiftCardService } from '../gift-card/gift-card.service';
import { GiftCardModel } from '../gift-card/entity/gift-card.model';
import { CouponTypeEnum } from '../ticket/enums/coupon-type.enum';
import { ErrorTypes } from '../../common/dto/error-code.const';
import { TrackEventDto } from '../ticket/dto/track-event.dto';

@Injectable()
export class AdminService {
  private readonly secondPaymentInfoPage: string;
  private readonly secondOrderInfoPage: string;
  private readonly secondPaymentStartDate: Date;

  constructor(
    @InjectPinoLogger(AdminService.name)
    private readonly logger: PinoLogger,
    private readonly sequelize: Sequelize,
    private readonly mqService: MqService,
    private readonly mailLogService: MailLogService,
    private readonly ticketAppealService: TicketAppealService,
    private readonly ticketImportService: TicketImportService,
    private readonly orderService: OrderService,
    private readonly ticketService: TicketService,
    private readonly ticketSubmissionService: TicketSubmissionService,
    private readonly transactionService: TransactionService,
    private readonly giftCardService: GiftCardService,
    private readonly statisticService: StatisticService,
  ) {
    this.secondPaymentInfoPage = paymentConfig().common.secondPaymentInfoPage;
    this.secondOrderInfoPage = paymentConfig().common.secondOrderInfoPage;
    this.secondPaymentStartDate = ticketConfig().secondPaymentStartDate;
    this.logger.debug(
      {
        secondPaymentInfoPage: this.secondPaymentInfoPage,
        secondOrderInfoPage: this.secondOrderInfoPage,
      },
      'AdminService initialized: ',
    );
  }

  async reissueInvoice(tradeNos: string[]) {
    let successCount = 0;
    let errorCount = 0;
    const data = [];
    for (const tradeNo of tradeNos) {
      try {
        const transactionDto =
          await this.ticketAppealService.issueInvoice(tradeNo);
        data.push({ tradeNo, transactionDto });
        successCount++;
      } catch (e) {
        this.logger.error({ e, tradeNo }, 'reissueInvoice error:');
        data.push({ tradeNo, error: e.message });
        errorCount++;
      }
    }
    return {
      successCount,
      errorCount,
      data,
    };
  }

  async sendOrderProgressEmailEvent(
    dto: ProgressEmailDto,
  ): Promise<Job<any, any, string>> {
    const job = await this.mqService.add(
      MqEnum.PROGRESS_EMAIL_QUEUE,
      dto,
      3000,
    );
    this.logger.debug({ job }, 'sendStatusEmailEvent job:');
    return job;
  }

  async updateToProcessingAndSendMail(
    id: number,
    dto: UpdateToProcessingReq,
  ): Promise<void> {
    this.logger.debug({ id }, 'updateToProcessing: ');
    try {
      await this.ticketAppealService.updateOrder(id, dto.toOrder());
      // update 不會取得關聯的 table，多查一次取得完整資訊
      const order = await this.orderService.findOne({ id }, true, true, false);
      // await this.sendOrderProgressEmailEvent(orderDto);
      await this.sendOrderProgressEmail({ order, email: dto.email });
    } catch (e) {
      throw new AdminException(
        'updateToProcessingAndSendMail failed',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async updateToSubmitted(id: number, dto: UpdateToSubmittedReq) {
    this.logger.debug({ id }, 'updateToSubmitted: ');
    const transaction = await this.sequelize.transaction();
    try {
      await this.ticketAppealService.updateOrder(id, dto.toOrder());
      await this.ticketSubmissionService.updateBulkByIds(
        dto.ticketSubmissionIds,
        dto.toTicketSubmissionDto(),
      );
      await transaction.commit();
    } catch (e) {
      if (transaction) await transaction.rollback();
      throw new AdminException(
        'updateToSubmitted failed',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async sendOrderProgressEmailById({ id, email }: SendProgressMailReq) {
    const order = await this.orderService.findOne({ id }, true, true, false);
    await this.sendOrderProgressEmail({ order, email });
  }

  async sendOrderProgressEmail({ order, email, extra }: ProgressEmailDto) {
    if (!order) throw new TicketException('order not found');
    const { subject, template, category, context } =
      await this.parseProgressTemplate(order, extra);
    // local 環境預設寄給 systemReceiver
    const to = appConfig().isLocalTest
      ? appConfig().systemReceiver
      : [email || order.user?.email];

    // this.logger.debug({ to }, 'sendOrderProgressEmail: ');
    const dto = new SendMailTemplateReq({
      to,
      subject,
      template,
      tag: 'ticket-appeal-system',
      context,
    });
    // this.logger.debug(dto, 'sendOrderProgressEmail: ');
    await this.mailLogService.sendTemplate(dto, category);
    await this.updateEmailSentAt(order.id, order.progress);
  }

  async updateEmailSentAt(orderId: number, progress: ProgressEnum) {
    let updated: Partial<OrderDto> = {};
    switch (progress) {
      case ProgressEnum.PROCESSING:
        updated = { emailProcessingAt: new Date() };
        break;
      case ProgressEnum.SUBMITTED:
        updated = { emailSubmittedAt: new Date() };
        break;
      case ProgressEnum.APPROVED:
      case ProgressEnum.PARTIAL_APPROVED:
      case ProgressEnum.REJECTED:
        updated = { emailCompletedAt: new Date() };
        break;
    }
    await this.orderService.update(orderId, updated);
    this.logger.debug({ orderId, updated }, 'updateEmailSentAt: ');
  }

  async parseProgressTemplate(
    order: OrderDto,
    extra?: any,
  ): Promise<ProgressMailDto> {
    const {
      orderNo,
      progress,
      firstStageTransaction,
      ticketSubmissions,
      createdAt,
    } = order;
    const createdAtFormat = DateUtil.twDayjs(createdAt).format(
      'YYYY-MM-DD HH:mm:ss',
    );
    const context = {
      ticketSubmissions,
      extra,
      orderNo: order.orderNo,
      createdAt: createdAtFormat,
    };
    if (order.isCompleted()) {
      const { codes, giftCardDiscount, giftCardExpiresDays } =
        await this.createGiftCardForProgress(order);
      const doneContext = {
        ...context,
        codes,
        giftCardDiscount,
        giftCardExpiresDays,
      };
      // 二階段付款模板
      if (order.isSecondPaymentUnpaid(this.secondPaymentStartDate)) {
        switch (firstStageTransaction.paymentProvider) {
          case PaymentProviderEnum.AFTEE:
            return {
              subject: `申訴進度更新：案件申訴成功通知（訂單編號：【${orderNo}】）`,
              template: 'order-progress-to-approved-aftee',
              category: MailLogCategory.PROGRESS_APPROVED,
              context: doneContext,
            };
          case PaymentProviderEnum.NEWEBPAY:
            return {
              subject: `申訴進度更新：案件申訴成功通知（訂單編號：【${orderNo}】）`,
              template: 'order-progress-to-approved-newebpay',
              category: MailLogCategory.PROGRESS_APPROVED,
              context: doneContext,
            };
          default:
            throw new AdminException('Payment provider is not supported');
        }
      }
      // 非成效金模板
      switch (progress) {
        case ProgressEnum.APPROVED:
          return {
            subject: `申訴進度更新：案件申訴成功通知（訂單編號：【${orderNo}】）`,
            template: 'order-progress-to-approved',
            category: MailLogCategory.PROGRESS_APPROVED,
            context: doneContext,
          };
        case ProgressEnum.PARTIAL_APPROVED:
          return {
            subject: `申訴進度更新：案件部分申訴成功通知（訂單編號：【${orderNo}】）`,
            template: 'order-progress-to-partial-approved',
            category: MailLogCategory.PROGRESS_PARTIAL_APPROVED,
            context: doneContext,
          };
        case ProgressEnum.REJECTED:
          return {
            subject: `申訴進度更新：案件申訴失敗通知（訂單編號：【${orderNo}】）`,
            template: 'order-progress-to-rejected',
            category: MailLogCategory.PROGRESS_REJECTED,
            context: doneContext,
          };
      }
    }

    // 一般模板
    switch (progress) {
      case ProgressEnum.PROCESSING:
        return {
          subject: `申訴進度更新：您的申訴訂單正在處理中（訂單編號：【${orderNo}】）`,
          template: 'order-progress-to-processing',
          category: MailLogCategory.PROGRESS_PROCESSING,
          context,
        };
      case ProgressEnum.SUBMITTED:
        return {
          subject: `申訴進度更新：案件已送至監理單位（訂單編號：【${orderNo}】）`,
          template: 'order-progress-to-submitted',
          category: MailLogCategory.PROGRESS_SUBMITTED,
          context,
        };
      default:
        throw new AdminException(
          `progress(${progress}) is invalid: ${Object.values(ProgressEnum)}`,
        );
    }
  }

  async updateBotStatus(
    ticketSubmissionId: number,
    dto: BotStatusUpdateReqDto,
  ): Promise<TicketSubmissionDto[]> {
    const ticketSubmission = this.ticketAppealService.findTicketSubmissionBy(
      {
        id: ticketSubmissionId,
      },
      false,
    );
    if (!ticketSubmission)
      throw new NotfoundException('ticketSubmission not found');
    return this.ticketSubmissionService.updateBulkByIds(
      ticketSubmissionId,
      dto.toTicketSubmissionDto(),
    );
  }

  async updateTicketSubmissions(
    dto: TicketSubmissionUpdateReqDto,
  ): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionService.updateBulkByIds(
      dto.ids,
      dto.toTicketSubmissionDto(),
    );
  }

  async checkAndUpdateToCompleted(orderId: number, dto: UpdateToCompletedReq) {
    this.logger.debug({ orderId, dto }, 'checkAndUpdateToDone: ');
    // 檢查 submission 是否所屬該 order
    const ticketSubmissions = await this.ticketSubmissionService.findAll(
      { id: dto.ticketSubmissionIds },
      false,
    );
    if (ticketSubmissions.some((ts) => ts.orderId !== orderId))
      throw new AdminException(
        'ticketSubmission is not belong to order: ' + orderId,
      );
    const transaction = await this.sequelize.transaction();
    // 先 update ticketSubmission
    try {
      const newTicketSubmissions =
        await this.ticketSubmissionService.updateBulkByIds(
          dto.ticketSubmissionIds,
          dto.toTicketSubmissionDto(),
          transaction,
        );

      if (!CommonUtil.isArray(newTicketSubmissions))
        throw new AdminException('ticketSubmission is not array');

      // 檢查 ticketSubmission 只要有一個沒有 appealResult 就不更新 order
      if (newTicketSubmissions.some((ts) => !ts.appealResult))
        throw new AdminException(
          `order(${orderId}) ticketSubmissions appealResult is not all set`,
        );

      dto.progress = this.parseProgress(newTicketSubmissions);
      const order = await this.ticketAppealService.updateOrder(
        orderId,
        dto.toOrder(),
        transaction,
      );

      await transaction.commit();
      return order;
    } catch (e) {
      if (transaction) await transaction.rollback();
      throw new AdminException(
        'checkAndUpdateToCompleted failed: ',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  private parseProgress(submissions: TicketSubmissionDto[]): ProgressEnum {
    const approvedCount = submissions.filter(
      (ts) => ts.appealResult === AppealResultEnum.APPROVED,
    ).length;
    const rejectedCount = submissions.filter(
      (ts) => ts.appealResult === AppealResultEnum.REJECTED,
    ).length;
    if (approvedCount === submissions.length) return ProgressEnum.APPROVED;
    if (rejectedCount === submissions.length) return ProgressEnum.REJECTED;
    else return ProgressEnum.PARTIAL_APPROVED;
  }

  async importFromGoogleSheet(file: Express.Multer.File) {
    return this.ticketImportService.importFromGoogleSheet(file);
  }

  async sendRejectMail(orderNo: string, email: string) {
    const order = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    if (!order) throw new NotfoundException(`Order not found: ${orderNo}`);
    if (!order.isRejected()) throw new AdminException('Order is not rejected');

    await this.sendOrderProgressEmail({ order, email });
  }

  async secondPaymentAndSendMail(orderNo: string, req: AdminSecondPaymentReq) {
    const order = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    if (!order) throw new NotfoundException(`Order not found: ${orderNo}`);
    if (!order.firstStageTransaction)
      throw new AdminException('First stage transaction is not found');
    // 符合條件才進行第二階段付款 & 付款信
    if (order.isSecondPaymentUnpaid(this.secondPaymentStartDate)) {
      // 寄成效金付款信後不可再寄，避免重複扣款
      if (order.emailCompletedAt)
        throw new AdminException('Email already sent');

      switch (order.firstStageTransaction.paymentProvider) {
        case PaymentProviderEnum.AFTEE:
          await this.secondPaymentForAftee(order, req);
          break;
        case PaymentProviderEnum.NEWEBPAY:
          await this.secondPaymentForNewebpay(order, req);
          break;
        default:
          throw new AdminException('Payment provider is not supported');
      }
    } else {
      // 不符合條件，只寄信
      await this.sendOrderProgressEmail({ order, email: req.email });
    }
  }

  async secondPaymentForAftee(
    orderDto: OrderDto,
    { successFee, email }: AdminSecondPaymentReq,
  ) {
    // 付款
    await this.ticketAppealService.secondPaymentForAftee(
      orderDto.orderNo,
      successFee,
    );
    // 寄信
    return this.sendMailForSecondPayment(orderDto, email, successFee);
  }

  async secondPaymentForNewebpay(
    orderDto: OrderDto,
    { successFee, email }: AdminSecondPaymentReq,
  ) {
    // 只寄信
    return this.sendMailForSecondPayment(orderDto, email, successFee);
  }

  private async sendMailForSecondPayment(
    order: OrderDto,
    email: string,
    successFee?: number,
  ) {
    const extra: ExtraApprovedInfoDto = {
      amount: successFee,
      secondPaymentInfoPage: this.parseUrl(this.secondPaymentInfoPage, order),
      secondOrderInfoPage: this.parseUrl(this.secondOrderInfoPage, order),
    };
    return this.sendOrderProgressEmail({ order, email, extra });
  }

  async calculateSecondPayment(orderNo: string): Promise<OrderSecondPriceDto> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      false,
      true,
      false,
    );
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderNo}`);
    return this.ticketAppealService.calculateOrderSecondPrice(
      orderDto.tickets,
      orderDto.ticketSubmissions,
      orderDto.firstStageTransaction?.payAt,
    );
  }

  private parseUrl(url: string, { id, orderNo }: OrderDto) {
    return url.replace(':id', id.toString()).replace(':orderNo', orderNo);
  }

  async cancelTransaction(req: TransactionCancelReq): Promise<void> {
    return this.ticketAppealService.cancelPayment(req);
  }

  async reGroupTicket(id: number): Promise<TicketDto> {
    return this.ticketAppealService.groupOrderTicket(id);
  }

  async checkOrderRecognized(orderId: number) {
    // return this.ticketAppealService.checkOrderRecognized(orderId);
    return this.ticketAppealService.checkAndUpdateOrderRecognizedEvent(orderId);
  }

  async duplicateTicket(id: number, newTicketNo: string): Promise<TicketDto> {
    return this.ticketAppealService.duplicateTicket(id, newTicketNo);
  }

  async createGiftCardForProgress({
    id,
    progress,
    progressDoneGiftCardId,
  }: OrderDto): Promise<{
    codes?: string[];
    giftCardDiscount?: number;
    giftCardExpiresDays?: number;
  }> {
    let giftCardDiscount: number;
    let giftCardExpiresDays: number;
    let dto: Partial<GiftCardModel>;
    switch (progress) {
      case ProgressEnum.APPROVED:
        giftCardDiscount = 50;
        giftCardExpiresDays = 180;
        dto = {
          expiredAt: DateUtil.addDateIncrement('180d'),
          value: 50,
          type: CouponTypeEnum.FIXED,
          ref: 'approved-email',
        };
        break;
      case ProgressEnum.PARTIAL_APPROVED:
        giftCardDiscount = 50;
        giftCardExpiresDays = 180;
        dto = {
          expiredAt: DateUtil.addDateIncrement('180d'),
          value: 50,
          type: CouponTypeEnum.FIXED,
          ref: 'partial-approved-email',
        };
        break;
      case ProgressEnum.REJECTED:
        giftCardDiscount = 30;
        giftCardExpiresDays = 30;
        dto = {
          expiredAt: DateUtil.addDateIncrement('30d'),
          value: 30,
          type: CouponTypeEnum.FIXED,
          ref: 'rejected-email',
        };
        break;
      default:
        this.logger.debug(
          `createGiftCardForProgress progress(${progress}) is invalid`,
        );
        return {};
    }
    const count = 3;
    this.logger.debug(
      { dto },
      `createGiftCardForProgress progress(${progress}) count(${count})`,
    );
    if (CommonUtil.isArray(progressDoneGiftCardId)) {
      const giftCards = await this.giftCardService.getAllGiftCards({
        id: progressDoneGiftCardId,
      });
      this.logger.warn(
        `skip: createGiftCardForProgress progressDoneGiftCardId(${progressDoneGiftCardId}) is already set`,
      );
      return {
        codes: giftCards.map((g) => g.code),
        giftCardDiscount,
        giftCardExpiresDays,
      };
    }
    const transaction = await this.sequelize.transaction();
    try {
      const giftCardModels = await this.giftCardService.createGiftCards(
        dto,
        count,
        transaction,
      );

      if (!CommonUtil.isArray(giftCardModels))
        throw new AdminException('giftCardModels is not array');
      await this.orderService.update(
        id,
        { progressDoneGiftCardId: giftCardModels.map((g) => g.id) },
        transaction,
      );
      await transaction.commit();
      return {
        codes: giftCardModels.map((g) => g.code),
        giftCardDiscount,
        giftCardExpiresDays,
      };
    } catch (e) {
      if (transaction) await transaction.rollback();
      if (e.errorCode) throw e;
      throw new AdminException(
        `createGiftCardForApproved failed: ${e}`,
        ErrorTypes.INVALID,
      );
    }
  }

  async sendFreeGiftCardEdm({
    subject,
    template,
    to,
    expires,
    type,
    value,
    count,
  }: SendFreeGiftCardEdmDto) {
    for (const t of to) {
      const data = this.genGiftCardTemplateForFree(
        template,
        expires,
        value,
        type,
        count,
      );
      const expiresText = expires
        .replace('d', '天')
        .replace('m', '月')
        .replace('y', '年');

      const codes = await this.giftCardService.createGiftCardWithoutOrder(
        data.giftCardModel,
        data.count,
      );
      await this.mailLogService.sendTemplate(
        new SendMailTemplateReq({
          to: t,
          subject,
          template,
          tag: template,
          context: { codes, count, expires: expiresText },
        }),
        MailLogCategory.EDM,
      );
    }
  }

  async sendOneTimeGiftCardEdm(
    subject: string,
    template: string,
    to: string[],
  ) {
    for (const t of to) {
      const data = this.genGiftCardTemplateForOneTime(template);
      const codes = await this.giftCardService.createGiftCardWithoutOrder(
        data.giftCardModel,
        data.count,
      );
      await this.mailLogService.sendTemplate(
        new SendMailTemplateReq({
          to: t,
          subject,
          template,
          tag: template,
          context: { codes },
        }),
        MailLogCategory.EDM,
      );
    }
  }

  genGiftCardTemplateForOneTime(template: string): {
    giftCardModel: Partial<GiftCardModel>;
    count: number;
  } {
    let giftCardModel: Partial<GiftCardModel>;
    let count: number;
    switch (template) {
      case 'gift-card-edm-for-approved':
        giftCardModel = {
          expiredAt: DateUtil.addDateIncrement('15d'),
          value: 30,
          type: CouponTypeEnum.FIXED,
          ref: template,
        };
        return { giftCardModel, count: 3 };
      case 'gift-card-edm-for-rejected':
        giftCardModel = {
          expiredAt: DateUtil.addDateIncrement('60d'),
          value: 50,
          type: CouponTypeEnum.FIXED,
          ref: template,
        };
        return { giftCardModel, count: 2 };
      case 'gift-card-edm-for-survey':
        giftCardModel = {
          expiredAt: DateUtil.addDateIncrement('15d'),
          value: 30,
          type: CouponTypeEnum.FIXED,
          ref: template,
        };
        return { giftCardModel, count: 1 };
      default:
        throw new AdminException(`template(${template}) is invalid`);
    }
  }

  genGiftCardTemplateForFree(
    template: string,
    expires: string,
    value: number,
    type: CouponTypeEnum,
    count: number,
  ): {
    giftCardModel: Partial<GiftCardModel>;
    count: number;
  } {
    const giftCardModel: Partial<GiftCardModel> = {
      expiredAt: DateUtil.addDateIncrement(expires),
      value,
      type,
      ref: template,
    };
    return { giftCardModel, count };
  }

  async getEventTimes(req: GetTrackEventReq): Promise<Record<string, any>[]> {
    // 查 db
    const createTicketTimes = await this.getEventTimesForCreateTicket(req);
    const paymentTimes = await this.getEventTimesForPayment(req);
    // 查 cache
    const cacheValues = await this.statisticService.getEventTimesFromCache(req);
    // 合併兩者
    cacheValues.forEach((item) => {
      item.clickCreateTicket = 0;
      item.clickPayment = 0;
    });

    let clickCreateTicketTotal = 0;
    let clickPaymentTotal = 0;
    createTicketTimes.forEach(({ date, count }) => {
      let find = cacheValues.find((item) => item.date === date);
      if (!find)
        cacheValues.push({
          date,
          clickCreateTicket: 0,
          clickPayment: 0,
        });
      find = cacheValues.find((item) => item.date === date);
      find.clickCreateTicket = count;
      clickCreateTicketTotal += count;
    });
    paymentTimes.forEach(({ date, count }) => {
      let find = cacheValues.find((item) => item.date === date);
      if (!find)
        cacheValues.push({
          date,
          clickCreateTicket: 0,
          clickPayment: 0,
        });
      find = cacheValues.find((item) => item.date === date);
      find.clickPayment = count;
      clickPaymentTotal += count;
    });

    cacheValues.find((item) => !item.date).clickCreateTicket =
      clickCreateTicketTotal;
    cacheValues.find((item) => !item.date).clickPayment = clickPaymentTotal;

    return cacheValues;
  }

  async getEventTimesForCreateTicket({
    startDate,
    endDate,
  }: GetTrackEventReq): Promise<TrackEventDto[]> {
    const start = startDate
      ? DateUtil.zoneDayjs(startDate).toDate()
      : new Date('2024-01-01');
    const end = endDate ? DateUtil.zoneDayjs(endDate).toDate() : new Date();
    return this.orderService.findAllForStatistic(start, end);
  }

  async getEventTimesForPayment({
    startDate,
    endDate,
  }: GetTrackEventReq): Promise<TrackEventDto[]> {
    const start = startDate
      ? DateUtil.zoneDayjs(startDate).toDate()
      : new Date('2024-01-01');
    const end = endDate ? DateUtil.zoneDayjs(endDate).toDate() : new Date();
    return this.transactionService.findAllForStatistic(start, end);
  }
}
