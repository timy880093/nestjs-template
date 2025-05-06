import { Injectable, OnModuleInit } from '@nestjs/common';
import { TicketDraftCreateDto } from '../dto/ticket-draft-create.dto';
import { TicketUpdateReq } from '../dto/ticket-update.req';
import { Sequelize } from 'sequelize-typescript';
import { TicketDto } from '../dto/ticket.dto';
import { TicketException } from '../../../common/exception/ticket.exception';
import { CommonUtil, DateUtil } from '../../../common/util';
import _ from 'lodash';
import { Transaction } from 'sequelize';
import { UploadService } from '../../upload/upload.service';
import { OrderDto } from '../dto/order.dto';
import { PaymentService } from '../../../third-party/payment/payment.service';
import {
  CancelPaymentReq,
  FirstPaymentReq,
  PaymentNotifyReq,
  PaymentProviderEnum,
  PaymentRes,
  PaymentReturnReq,
  PaymentStatusEnum,
  UpdatePaymentReq,
} from '../../../third-party/payment/dto';
import ticketConfig from '../ticket.config';
import {
  OrderFirstPriceDto,
  OrderSecondPriceDto,
  TicketFineDto,
} from '../dto/order-price.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { OrderUpdateDto } from '../dto/order-update.dto';
import { NewebpayReq } from '../../../third-party/payment/dto/newebpay';
import { NotfoundException } from '../../../common/exception/notfound.exception';
import { ErrorTypes } from '../../../common/dto/error-code.const';
import { RedisService } from '../../../third-party/redis/redis.service';
import { TicketSubmissionRepository } from '../repository/ticket-submission.repository';
import { CouponDto } from '../dto/coupon.dto';
import { UsersService } from '../../users/users.service';
import {
  AppealResultEnum,
  BotSubmittedStatusEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import paymentConfig from '../../../third-party/payment/payment.config';
import { ProgressEnum } from '../enums/order.enum';
import { RecognitionService } from '../../recognition/recognition.service';
import { TicketDraftUpdateDto } from '../dto/ticket-draft-update.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TicketUtil } from '../utils/ticket.util';
import { TicketSubmissionDto } from '../dto/ticket-submission.dto';
import { SendMailTemplateReq } from '../../../third-party/mail/dto/send-mail-template.req';
import { PenaltyRepository } from '../repository/penalty.repository';
import { OrderService } from '../service/order.service';
import { TicketService } from '../service/ticket.service';
import { TransactionService } from '../service/transaction.service';
import { CouponService } from '../service/coupon.service';
import { CreatePaymentReqDto } from '../dto/create-payment.req.dto';
import { RecognizeLogService } from '../service/recognize-log.service';
import { InvoiceService } from '../../../third-party/invoice/invoice.service';
import { RecognizeLogDto } from '../dto/recognize-log.dto';
import { UserDto } from '../../users/dto/user.dto';
import { TransactionBuilder } from '../utils/transaction-builder';
import { ItemService } from '../../item/item.service';
import { Item } from '../../item/item';
import { OrderPublicDto } from '../dto/order-public.dto';
import { TransactionCancelReq } from '../dto/transaction-cancel.req';
import { UserInfo } from '../../../common/decorator/token-user.decorator';
import { RoleEnum } from '../../users/dto/role.enum';
import { OrderBuilder } from '../utils/order-builder';
import {
  CouponDiscountDto,
  CouponDiscountTypeEnum,
} from '../dto/coupon-discount.dto';
import { SourceEnum } from '../../../common/dto/source.enum';
import { GiftCardService } from 'src/modules/gift-card/gift-card.service';
import { MqEnum } from '../../../third-party/mq/mq.enum';
import { MqService } from '../../../third-party/mq/mq.service';
import { Job } from 'bullmq';
import { TicketSubmissionService } from '../service/ticket-submission.service';
import { MailLogService } from '../../mail-log/mail-log.service';
import { MailLogCategory } from '../../mail-log/dto/mail-log.enum';
import { MailLogDto } from '../../mail-log/dto/mail-log.dto';
import appConfig from '../../../config/app.config';
import { MvdisTicketResDto } from '../../mvdis/dto/mvdis-List-res.dto';
import { MvdisService } from '../../mvdis/mvdis.service';
import { CouponTypeEnum } from '../enums/coupon-type.enum';

@Injectable()
export class TicketAppealService implements OnModuleInit {
  private serviceItem: Item;
  private additionalItem: Item;
  private freeItem: Item;
  private successItem: Item;
  private readonly continuousTicketIntervalMinutes: number;
  private readonly urgentDays: number;
  private readonly deadlineDays: number;
  private readonly successFeeRate: number;
  private readonly secondPaymentStartDate: Date;
  private readonly successFeeRate2: number;
  private readonly secondPaymentStartDate2: Date;
  private readonly systemReceiver: string;

  constructor(
    @InjectPinoLogger(TicketAppealService.name)
    private readonly logger: PinoLogger,
    private readonly sequelize: Sequelize,
    private readonly uploadService: UploadService,
    private readonly usersService: UsersService,
    private readonly ticketService: TicketService,
    private readonly ticketSubmissionService: TicketSubmissionService,
    private readonly ticketSubmissionRepository: TicketSubmissionRepository,
    private readonly orderService: OrderService,
    private readonly transactionService: TransactionService,
    private readonly couponService: CouponService,
    private readonly penaltyRepository: PenaltyRepository,
    private readonly paymentService: PaymentService,
    private readonly invoiceService: InvoiceService,
    private readonly redisService: RedisService,
    private readonly mqService: MqService,
    private readonly recognitionService: RecognitionService,
    private readonly recognizeLogService: RecognizeLogService,
    private readonly mailLogService: MailLogService,
    private readonly itemService: ItemService,
    private readonly giftCardService: GiftCardService,
    private readonly mvdisService: MvdisService,
  ) {
    this.logger.info(
      { paymentConfig: paymentConfig() },
      'Init payment config: ',
    );
    this.continuousTicketIntervalMinutes =
      ticketConfig().continuousTicketIntervalMinutes;
    this.urgentDays = ticketConfig().urgentDays;
    this.deadlineDays = ticketConfig().deadlineDays;
    this.successFeeRate = ticketConfig().successFeeRate;
    this.secondPaymentStartDate = ticketConfig().secondPaymentStartDate;
    this.successFeeRate2 = ticketConfig().successFeeRate2;
    this.secondPaymentStartDate2 = ticketConfig().secondPaymentStartDate2;
    this.systemReceiver = appConfig().systemReceiver;
  }

  async onModuleInit() {
    this.serviceItem = await this.itemService.getServiceFeeItem();
    this.additionalItem = await this.itemService.getAdditionalFeeItem();
    this.freeItem = await this.itemService.getFreeItem();
    this.successItem = await this.itemService.getSuccessFeeItem();
  }

  async findTicketById(
    ticketId: number,
    userInfo: UserInfo,
    includeFiles: boolean,
  ): Promise<TicketDto> {
    const ticket = await this.ticketService.findOne(
      { id: ticketId },
      true,
      true,
      true,
    );
    if (!ticket) throw new NotfoundException(`Ticket not found: ${ticketId}`);

    this.checkDataBelong(userInfo, ticket);

    if (includeFiles) {
      const files = await this.uploadService.findAllByIds([
        ...ticket.ticketInfoFileIds,
        ...ticket.violationFileIds,
      ]);
      ticket.ticketInfoFiles = files.filter((file) =>
        ticket.ticketInfoFileIds.includes(file.id),
      );
      ticket.violationFiles = files.filter((file) =>
        ticket.violationFileIds.includes(file.id),
      );
    }
    return ticket;
  }

  async createDraftTicket(
    userId: number,
    ticketCreateDto: TicketDraftCreateDto,
  ): Promise<TicketDto> {
    return this.ticketService.createDraft(userId, ticketCreateDto);
  }

  // 罰單儲存草稿
  async updateTicketDraft(
    ticketId: number,
    userInfo: UserInfo,
    updateDto: TicketDraftUpdateDto,
  ): Promise<TicketDto> {
    const original = await this.ticketService.findOneById(ticketId);
    if (!original) throw new NotfoundException(`Ticket not found: ${ticketId}`);
    this.checkDataBelong(userInfo, original);
    // 防呆：僅限草稿單 isDraft = true 可用
    if (original.isDraft === false)
      throw new TicketException(
        `Ticket is not draft, not allow update: ${ticketId}`,
      );
    const transaction = await this.sequelize.transaction();
    try {
      const newTicketDto = TicketUpdateReq.merge(original, updateDto, true);
      const ticket = await this.ticketService.update(
        ticketId,
        newTicketDto,
        transaction,
      );
      // await this.updateUploadFilesStatus(
      //   updateDto as TicketUpdateReq,
      //   original,
      //   transaction,
      // );
      await transaction.commit();
      return ticket;
    } catch (e) {
      await transaction.rollback();
      e.message = `Update ticket draft failed: ${e.message}`;
      throw e;
    }
  }

  async upsertTicketAndOrder(updatedTicket: TicketDto): Promise<TicketDto> {
    // 找出是否有該筆 ticket
    const originalTicket = await this.ticketService.findOneById(
      updatedTicket.id,
    );
    if (!originalTicket)
      throw new NotfoundException(`Ticket not found: ${updatedTicket.id}`);

    const user = await this.usersService.findOneById(updatedTicket.userId);
    if (!user)
      throw new NotfoundException(`User not found: ${updatedTicket.userId}`);

    await this.checkTicketNoDuplicated(
      updatedTicket.ticketNo,
      originalTicket.id,
    );
    const finalTicket = originalTicket
      ? Object.assign({}, originalTicket, updatedTicket)
      : updatedTicket;

    const transaction = await this.sequelize.transaction();
    try {
      // 每次新增/修改都要重新判斷分組
      finalTicket.orderId = await this.groupContinuousTicketOrCreateOrder(
        finalTicket,
        user,
      );
      // TODO order 要確認付款狀態是失敗
      const result = await this.ticketService.upsert(finalTicket, transaction);
      await transaction.commit();
      return result;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `Upsert ticket failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async groupOrderTicket(
    ticketId: number,
    updated?: TicketDto,
  ): Promise<TicketDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const original = await this.ticketService.findOneById(ticketId);
      if (!original)
        throw new NotfoundException(`Ticket not found: ${ticketId}`);
      const user = await this.usersService.findOneById(original.userId);

      const newOrderId = await this.groupContinuousTicketOrCreateOrder(
        original,
        user,
        transaction,
      );

      let ticketResult = original;
      if (original.orderId !== newOrderId) {
        ticketResult = await this.ticketService.update(
          original.id,
          new TicketDto({ orderId: newOrderId }),
          transaction,
        );
        await this.orderService.removeUnusedOrder(
          original.orderId,
          newOrderId,
          transaction,
        );
      }
      await transaction.commit();
      this.logger.info(
        { ticketId, originalOrderId: original.orderId, newOrderId },
        'Group order ticket: ',
      );
      return ticketResult;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `Group order tickets failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  // 罰單更新為正式稿
  async updateTicketAndGroupOrder(
    ticketId: number,
    userInfo: UserInfo,
    updatedDto?: TicketUpdateReq,
  ): Promise<TicketDto> {
    const original = await this.ticketService.findOneById(ticketId);
    if (!original) throw new NotfoundException(`Ticket not found: ${ticketId}`);
    const user = await this.usersService.findOneById(original.userId);

    this.checkDataBelong(userInfo, original);
    const finalTicket = updatedDto
      ? TicketUpdateReq.merge(original, updatedDto, false)
      : original;

    const transaction = await this.sequelize.transaction();
    try {
      const orderId = await this.groupContinuousTicketOrCreateOrder(
        finalTicket,
        user,
        transaction,
      );
      finalTicket.orderId = orderId;
      await this.checkTicketNoDuplicated(finalTicket.ticketNo, ticketId);
      const ticket = await this.ticketService.update(
        ticketId,
        finalTicket,
        transaction,
      );
      await this.updateUploadFilesStatus(updatedDto, original, transaction);
      // 若 orderId 分組有更改，則檢查原 orderId 是否還有所屬罰單，沒有的話刪除該 order
      await this.orderService.removeUnusedOrder(
        original.orderId,
        orderId,
        transaction,
      );
      // 檢查罰單是否需重新辨識，若有錯不影響儲存罰單
      try {
        await this.reRecognize(ticket, userInfo, transaction);
      } catch (e) {
        this.logger.warn({ error: e.message }, 'reRecognize: ');
      }
      await transaction.commit();
      return ticket;
    } catch (e) {
      await transaction.rollback();
      e.message = `Update ticket and group failed: ${e.message}`;
      throw e;
    }
  }

  // 沒有辨識紀錄 or 檔案有變動會觸發重新辨識
  private async reRecognize(
    ticket: TicketDto,
    userInfo: UserInfo,
    transaction?: Transaction,
  ): Promise<void> {
    try {
      const { id: ticketId } = ticket;
      const allFileIds = ticket.allFileIds();
      const recognizeLogDto = await this.recognizeLogService.findOneLatest({
        ticketId,
      });

      // 沒有辨識紀錄
      if (!recognizeLogDto) {
        this.logger.warn(
          { ticketId, userId: userInfo.id },
          'reRecognize when never recognize ticket: ',
        );
        await this.recognizeTicket(true, ticketId, userInfo, transaction);
        return;
      }
      // 檔案有變動
      const isFileIdsEqual = this.isFileIdsEqual(
        recognizeLogDto.ticketInfoFileIds,
        allFileIds,
      );
      if (!isFileIdsEqual) {
        this.logger.debug(
          {
            ticketId,
            userId: userInfo.id,
            recognizeFileIds: recognizeLogDto.ticketInfoFileIds,
            allFileIds,
          },
          'reRecognize when recognize ticket file and user upload file are different: ',
        );
        await this.recognizeTicket(false, ticketId, userInfo, transaction);
      }
    } catch (e) {
      throw new TicketException(
        `Re-recognize ticket failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  private isFileIdsEqual(
    recognizeLogFileIds: number[],
    combinedTicketFileIds: number[],
  ): boolean {
    // 去重複後再作比較
    return CommonUtil.isSameArray(
      _.uniq(recognizeLogFileIds || []),
      _.uniq(combinedTicketFileIds || []),
    );
  }

  /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        1. find all tickets by userId
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        2. validate newTicketDto
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        3. filter tickets by licensePlateNo and violationFact and violateAt
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        3-1. if no matched group, create new order
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        3-2. if matched group, assign orderId
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        4. remove unused order
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */
  private async groupContinuousTicketOrCreateOrder(
    target: TicketDto,
    { id: userId, email, phone }: UserDto,
    transaction?: Transaction,
  ): Promise<number> {
    let groupOrderId: number;
    try {
      const ticketDtos = await this.findUnpaidTickets(
        target.userId,
        transaction,
      );
      if (CommonUtil.isArray(ticketDtos)) {
        groupOrderId = this.takeGroupOrderId(
          target,
          ticketDtos,
          this.continuousTicketIntervalMinutes,
        );
      }
      if (groupOrderId) return groupOrderId;
      // 若找不到分組，創建新 order
      const orderDto = await this.orderService.create(
        OrderBuilder.toCreate2(
          userId,
          email,
          phone,
          target.violationFactType,
          target.violationFact,
        ),
        transaction,
      );
      this.logger.debug({ orderId: orderDto.id }, 'Create new order: ');
      return orderDto.id;
    } catch (e) {
      throw new TicketException(
        `Group ticket failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async findUnpaidTickets(
    userId: number,
    transaction: Transaction,
  ): Promise<TicketDto[]> {
    try {
      const orderModels = await this.orderService.findAll(
        { userId, paymentStatus: PaymentStatusEnum.UNPAID },
        false,
        true,
        true,
        null,
        transaction,
      );
      return orderModels.map((order) => order.tickets).flat();
    } catch (e) {
      throw new TicketException(
        `Find grouped tickets by userId ${userId} failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  takeGroupOrderId(
    target: Partial<TicketDto>,
    existTickets: Partial<TicketDto>[],
    continuousTicketIntervalMinutes: number = this
      .continuousTicketIntervalMinutes,
  ) {
    // 初步過濾
    let filterDtos = _(existTickets)
      // .filter((exists) => exists.id !== updated.id)
      .filter((exists) => this.groupFilter(target, exists))
      .sortBy((t) => t.violateAt)
      .value();

    // 沒有符合條件的罰單
    if (!CommonUtil.isArray(filterDtos)) return;

    // 該訂單只有自己一筆，則不改 order_id
    if (filterDtos.length === 1 && filterDtos.some((t) => t.id === target.id))
      return target.orderId;

    // 過濾掉當前這筆被更新的
    filterDtos = filterDtos.filter((t) => t.id !== target.id);
    // 根據 order_id 先分組
    const orderGroup = _.groupBy(filterDtos, 'orderId');

    // calculate orderGroup expiresAt start and end
    for (const [orderId, tickets] of Object.entries(orderGroup)) {
      const violateAtDates = tickets
        .filter((ticket) => ticket.violateAt)
        .map((ticket) => ticket.violateAt);
      if (violateAtDates.length != 0) {
        const start = DateUtil.zoneDayjs(_.min(violateAtDates))
          .subtract(continuousTicketIntervalMinutes, 'm')
          .toDate();
        const end = DateUtil.zoneDayjs(_.max(violateAtDates))
          .add(continuousTicketIntervalMinutes, 'm')
          .toDate();
        if (DateUtil.isBetween(target.violateAt, start, end))
          return orderId && _.toNumber(orderId);
      }
    }
    return;
  }

  private groupFilter(
    updated: Partial<TicketDto>,
    exists: Partial<TicketDto>,
  ): boolean {
    let isSameFact = false;
    if (updated.violationFactType === exists.violationFactType) {
      isSameFact =
        updated.violationFactType === ViolationFactTypeEnum.OTHER
          ? updated.violationFact === exists.violationFact
          : true;
    }

    return (
      updated.licensePlateNo === exists.licensePlateNo &&
      updated.ownerIdNo === exists.ownerIdNo &&
      updated.driverIdNo === exists.driverIdNo &&
      // updated.isOwnerSameAsDriver === exists.isOwnerSameAsDriver &&
      updated.assignedOfficeCity === exists.assignedOfficeCity &&
      isSameFact
    );
  }

  async removeTicket(ticketId: number, userInfo: UserInfo) {
    const ticketDto = await this.ticketService.findOneById(ticketId);
    if (!ticketDto)
      throw new NotfoundException(`Ticket not found: ${ticketId}`);
    this.checkDataBelong(userInfo, ticketDto);

    if (ticketDto.isDraft) {
      return await this.ticketService.remove(ticketId);
    }
    // 正式單：要檢查屬於哪個訂單，若訂單只有一筆罰單，則一併刪除訂單
    const transaction = await this.sequelize.transaction();
    try {
      await this.ticketService.remove(ticketId);
      await this.orderService.removeUnusedOrder(
        ticketDto.orderId,
        null,
        transaction,
      );
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      e.message = `Remove ticket failed: ${e.message}`;
      throw e;
    }
  }

  //TODO:check upload_files is_using and update
  private async updateUploadFilesStatus(
    updated: TicketUpdateReq,
    original: TicketDto,
    transaction: Transaction,
  ) {}

  async getFirstPriceById(id: number): Promise<OrderFirstPriceDto> {
    const orderDto = await this.orderService.findOne(
      { id },
      false,
      true,
      false,
    );
    return this.getFirstPrice(orderDto);
  }

  async getFirstPriceByOrderNo(orderNo: string): Promise<OrderFirstPriceDto> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      false,
      true,
      false,
    );
    return this.getFirstPrice(orderDto);
  }

  async getFirstPrice(orderDto: OrderDto): Promise<OrderFirstPriceDto> {
    if (!orderDto)
      throw new NotfoundException(`Order not found: ${orderDto.id}`);
    if (!CommonUtil.isArray(orderDto.tickets))
      throw new TicketException(
        'Get price data failed: tickets is empty array',
      );
    const additionalFee = TicketUtil.calculateAdditionalFee(
      orderDto.tickets,
      this.urgentDays,
      this.additionalItem.amount,
      DateUtil.twDayjs()?.toDate(),
    );
    return {
      serviceFee: this.serviceItem.amount,
      additionalFee,
    };
  }

  // 取得第一階段動態手續費&加急費用
  async getDynamicFirstPrice(
    orderId: number,
    isPriority?: boolean,
  ): Promise<OrderFirstPriceDto> {
    const orderDto = await this.orderService.findOne(
      { id: orderId },
      false,
      true,
      false,
    );
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderId}`);

    return this.calculateOrderFirstPrice(
      orderDto,
      this.serviceItem.amount,
      isPriority,
    );
  }

  async calculateOrderFirstPrice(
    { tickets }: OrderDto,
    serviceFee: number,
    isPriority?: boolean,
  ): Promise<OrderFirstPriceDto> {
    let finalRemark: string;
    try {
      if (!CommonUtil.isArray(tickets))
        throw new TicketException('Order tickets is empty array');
      const promise = tickets.map(async (ticket) => {
        const recognizeLogDto = await this.recognizeLogService.findOneLatest({
          ticketId: ticket.id,
        });
        return this.calculateTicketFirstAmount(ticket, recognizeLogDto);
      });
      const amountArray = await Promise.all(promise);

      finalRemark = amountArray
        .filter((a) => a.remark)
        .map((a) => a.remark)
        .join(' | ');
      // for (const { amount, remark } of amountArray) {
      //   finalRemark += `${remark} | `; //每筆計價邏輯備註
      //   if (amount > serviceFee) serviceFee = amount;
      // }
      this.logger.debug({ serviceFee, finalRemark }, 'getDynamicOrderPrice: ');
    } catch (e) {
      this.logger.warn({ message: e.message }, 'getDynamicOrderPrice: ');
      serviceFee = this.serviceItem.amount;
    }
    // const penaltyPrice = await this.calculateTicketPrice(orderDto.tickets);
    const additionalFee =
      isPriority === true
        ? this.additionalItem.amount
        : TicketUtil.calculateAdditionalFee(
            tickets,
            this.urgentDays,
            this.additionalItem.amount,
          );

    return {
      serviceFee,
      additionalFee,
      remark: finalRemark,
    };
  }

  async getOrderSecondPrice(orderNo: string): Promise<OrderSecondPriceDto> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      false,
      true,
      true,
    );
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderNo}`);

    const dto = await this.calculateOrderSecondPrice(
      orderDto.tickets,
      orderDto.ticketSubmissions,
      orderDto?.firstStageTransaction?.payAt,
    );
    dto.provider = orderDto?.firstStageTransaction?.paymentProvider;
    dto.firstPayAt = orderDto?.firstStageTransaction?.payAt;
    return dto;
  }

  async calculateOrderSecondPrice(
    tickets: TicketDto[],
    submissions: TicketSubmissionDto[],
    payAt: Date,
  ): Promise<OrderSecondPriceDto> {
    if (!payAt) throw new TicketException('PayAt is required');
    try {
      //FIXME 改cache?
      const penaltyItem = await this.itemService.getPenaltySuccessFeeItem();
      if (!penaltyItem)
        throw new TicketException('Penalty Success Fee is not set');

      const promise = tickets.map(async (ticket) => {
        // const recognizeLogDto = await this.recognizeLogService.findOneLatest({
        //   ticketId: ticket.id,
        // });
        const submission = submissions.find((ts) => ts.ticketId === ticket.id);
        return this.calculateTicketSecondAmount(
          submission,
          payAt,
          penaltyItem.amount,
        );
      });
      const orderSecondPriceDtos = await Promise.all(promise);

      this.logger.debug(
        { orderSecondPriceDtos },
        'calculateOrderSecondPrice: ',
      );

      return orderSecondPriceDtos.reduce(
        (acc, cur) => {
          if (cur.amount) {
            // if (!acc.amount) acc.amount = 0;
            // acc.amount += cur.amount;
            acc.amount = acc.amount ? acc.amount + cur.amount : cur.amount;
          }
          if (cur.violationFine) {
            if (!acc.violationFine) acc.violationFine = 0;
            acc.violationFine += cur.violationFine;
          }
          if (cur.appealViolationFine) {
            if (!acc.appealViolationFine) acc.appealViolationFine = 0;
            acc.appealViolationFine += cur.appealViolationFine;
          }
          // 計算罰則數量
          if (cur.penaltyCount) {
            acc.penaltyCount += cur.penaltyCount;
          }
          if (cur.reducedFine) {
            if (!acc.reducedFine) acc.reducedFine = 0;
            acc.reducedFine += cur.reducedFine;
          }
          acc.percentage = cur.percentage;
          return acc;
        },
        {
          amount: undefined,
          violationFine: undefined,
          appealViolationFine: undefined,
          penaltyCount: 0,
          reducedFine: undefined,
          percentage: 0,
        },
      );
    } catch (e) {
      // this.logger.warn({ message: e.message }, 'calculateSecondPrice error: ');
      // return;
      throw new TicketException(
        `calculateSecondPrice error: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async applyCouponDiscountForPayment(
    userId: number,
    couponCode?: string,
  ): Promise<CouponDiscountDto> {
    try {
      return await this.getCouponDiscount(userId, couponCode);
    } catch (e) {
      return CouponDiscountDto.noCoupon(e.message);
    }
  }

  // 優惠券
  async getCouponDiscount(
    userId: number,
    couponCode?: string,
  ): Promise<CouponDiscountDto> {
    if (!couponCode)
      throw new TicketException(`can not be empty`, ErrorTypes.NOT_FOUND);
    const orders = await this.orderService.findAll(
      { userId },
      false,
      false,
      true,
    );
    const couponPromise = this.couponService.findOneLikeCode(couponCode);
    const giftCardPromise = this.giftCardService.getGiftCardByCode(couponCode);
    const [coupon, giftCard] = await Promise.all([
      couponPromise,
      giftCardPromise,
    ]);

    if (coupon) {
      this.logger.debug({ coupon }, 'getCouponDiscount: ');
      if (!coupon.isActive)
        throw new TicketException(
          `Coupon(${couponCode}) is not active`,
          ErrorTypes.COUPON_NOT_ACTIVE,
        );
      if (coupon.isExpired())
        throw new TicketException(
          `Coupon(${couponCode}) is expired`,
          ErrorTypes.COUPON_EXPIRED,
        );
      if (coupon.isNoQuota())
        throw new TicketException(
          `Coupon(${couponCode}) is no quota`,
          ErrorTypes.COUPON_NO_QUOTA,
        );
      if (this.checkOverCouponLimitPerUser(orders, coupon))
        throw new TicketException(
          `Coupon(${couponCode}) limit per user exceeded`,
          ErrorTypes.COUPON_LIMIT_EXCEEDED,
        );
      return new CouponDiscountDto({
        id: coupon.id,
        type: CouponDiscountTypeEnum.COUPON,
        description: coupon.description,
        discount: coupon.calculateDiscountAmount(this.serviceItem.amount),
        discountAdditionalFee: coupon.calculateDiscountAdditionalFee(
          this.additionalItem.amount,
        ),
      });
    }

    if (giftCard) {
      this.logger.debug({ giftCard }, 'getCouponDiscount: ');
      if (giftCard.expiredAt < new Date())
        throw new TicketException(
          `GiftCard(${couponCode}) is expired`,
          ErrorTypes.GIFT_CARD_EXPIRED,
        );
      // 驗證禮物卡序號是否使用過
      if (giftCard.usedAt) {
        throw new TicketException(
          `GiftCard(${couponCode}) is already used`,
          ErrorTypes.GIFT_CARD_ALREADY_USED,
        );
      }

      let discount: number;
      switch (giftCard.type) {
        case CouponTypeEnum.FIXED:
          discount = giftCard.value;
          break;
        case CouponTypeEnum.PERCENTAGE:
          discount = (this.serviceItem.amount * giftCard.value) / 100;
          break;
      }
      return new CouponDiscountDto({
        id: giftCard.id,
        type: CouponDiscountTypeEnum.GIFT_CARD,
        description: giftCard.orderDetails?.item?.description || '回饋碼折扣',
        discount,
      });
    }
    throw new TicketException('Coupon not found', ErrorTypes.NOT_FOUND);
  }

  // 檢查使用者訂單可使用的優惠券總限制次數
  private checkUserUsedCouponTotalLimit(
    orders: OrderDto[],
    totalLimitPerUser: number = 1,
  ) {
    if (!CommonUtil.isArray(orders)) return false;

    const usedCouponCount = orders.reduce((count, order) => {
      return order.firstStageTransaction?.couponId &&
        order.firstStageTransaction?.isSuccessful()
        ? count + 1
        : count;
    }, 0);
    return usedCouponCount <= totalLimitPerUser;
  }

  // 檢查使用者訂單可使用的每個優惠券限制次數
  private checkOverCouponLimitPerUser(
    orders: OrderDto[],
    coupon: CouponDto,
  ): boolean {
    if (!CommonUtil.isArray(orders)) return false;

    const usedCouponCount = orders
      .filter((o) => o.firstStageTransaction)
      .map((o) => o.firstStageTransaction)
      .reduce((count, firstStageTransaction) => {
        return firstStageTransaction.couponId &&
          firstStageTransaction.isSuccessful() &&
          firstStageTransaction.couponId === coupon.id
          ? count + 1
          : count;
      }, 0);

    return coupon.isOverLimitPerUser(usedCouponCount);
  }

  async buildFirstTransaction(
    userDto: UserDto,
    orderDto: OrderDto,
    { couponCode, isPriority, paymentProvider, phone }: CreatePaymentReqDto,
  ): Promise<TransactionDto> {
    const { serviceFee, additionalFee, remark } =
      await this.calculateOrderFirstPrice(
        orderDto,
        this.serviceItem.amount,
        isPriority,
      );
    this.logger.debug(
      { serviceFee, additionalFee, remark },
      'buildFirstTransaction: ',
    );

    const { discount, discountAdditionalFee, id, type } =
      await this.applyCouponDiscountForPayment(userDto.id, couponCode);
    const totalAmount =
      Math.max(serviceFee - (discount || 0), 0) +
      Math.max((additionalFee || 0) - (discountAdditionalFee || 0), 0);
    const couponId = type === CouponDiscountTypeEnum.COUPON ? id : null;
    const giftCardId = type === CouponDiscountTypeEnum.GIFT_CARD ? id : null;
    return TransactionBuilder.buildFirstTransaction(
      orderDto.id,
      couponId,
      giftCardId,
      orderDto.orderNo,
      userDto.username,
      userDto.uuid,
      userDto.email,
      phone || userDto.phone, //畫面填的優先
      serviceFee,
      additionalFee,
      totalAmount,
      isPriority,
      paymentProvider,
      remark,
      this.serviceItem.description,
      this.freeItem.description,
    );
  }

  // 由後端計價 不從前端怕 user 擱置分頁不關而導致過期還能送單的情況發生
  async firstPaymentById(
    id: number,
    createPaymentReqDto: CreatePaymentReqDto,
    userInfo?: UserInfo,
  ): Promise<FirstPaymentReq> {
    const orderDto = await this.orderService.findOne({ id }, true, true, true);
    return this.firstPayment(orderDto, createPaymentReqDto, null, userInfo);
  }

  // 由前台決定 returnURL
  async firstPaymentByOrderNo(
    orderNo: string,
    createPaymentReqDto: CreatePaymentReqDto,
    returnURL: string,
    userInfo?: UserInfo,
  ): Promise<FirstPaymentReq> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    return this.firstPayment(
      orderDto,
      createPaymentReqDto,
      returnURL,
      userInfo,
    );
  }

  async firstPayment(
    orderDto: OrderDto,
    createPaymentReqDto: CreatePaymentReqDto,
    returnURL: string,
    userInfo?: UserInfo,
  ): Promise<FirstPaymentReq> {
    if (!orderDto)
      throw new NotfoundException(`Order not found: ${orderDto.orderNo}`);
    if (!userInfo) {
      const userDto = await this.usersService.findOneById(orderDto.userId);
      userInfo = { id: userDto.id, role: userDto.role };
    }
    const order = await this.checkOrderForFirstPayment(orderDto, userInfo);
    const user = order.user;
    const transactionDto = await this.buildFirstTransaction(
      user,
      order,
      createPaymentReqDto,
    );
    const transaction = await this.sequelize.transaction();
    try {
      await this.updateUsedCoupon(
        transactionDto.couponId,
        createPaymentReqDto.couponCode,
        transaction,
      );
      const transactionResult = await this.transactionService.create(
        transactionDto,
        transaction,
      );
      await transaction.commit();

      const { totalAmountPaid, timesPaid } = await this.calculatePaymentHistory(
        user.uuid,
        createPaymentReqDto.paymentProvider,
      );
      return this.paymentService.paymentData(
        createPaymentReqDto.paymentProvider,
        TransactionBuilder.buildPaymentReq(
          transactionResult,
          totalAmountPaid,
          timesPaid,
          returnURL,
        ),
      );
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `firstPayment error: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async firstPaymentFreeById(
    id: number,
    createPaymentReqDto: CreatePaymentReqDto,
    userInfo?: UserInfo,
  ): Promise<OrderDto> {
    const orderDto = await this.orderService.findOne({ id }, true, true, true);
    return this.firstPaymentFree(orderDto, createPaymentReqDto, userInfo);
  }

  async firstPaymentFreeByOrderNo(
    orderNo: string,
    createPaymentReqDto: CreatePaymentReqDto,
    userInfo?: UserInfo,
  ): Promise<OrderDto> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    return this.firstPaymentFree(orderDto, createPaymentReqDto, userInfo);
  }

  async firstPaymentFree(
    orderDto: OrderDto,
    createPaymentReqDto: CreatePaymentReqDto,
    userInfo?: UserInfo,
  ): Promise<OrderDto> {
    // FIXME 查價格 查優惠券 確認價格是 0
    const { serviceFee } = await this.getFirstPrice(orderDto);
    const { discount, type, id, description } =
      await this.applyCouponDiscountForPayment(
        orderDto.userId,
        createPaymentReqDto.couponCode,
      );
    if (discount === 0) throw new TicketException(description);

    if (!orderDto)
      throw new NotfoundException(`Order not found: ${orderDto.orderNo}`);
    if (!userInfo) {
      const userDto = await this.usersService.findOneById(orderDto.userId);
      userInfo = { id: userDto.id, role: userDto.role };
    }
    const order = await this.checkOrderForFirstPayment(orderDto, userInfo);
    const user = order.user;
    if (!createPaymentReqDto.paymentProvider)
      createPaymentReqDto.paymentProvider = PaymentProviderEnum.NEWEBPAY;
    const transactionDto = await this.buildFirstTransaction(
      user,
      order,
      createPaymentReqDto,
    );
    // 免費直接設 payAt
    transactionDto.payAt = new Date();

    const transaction = await this.sequelize.transaction();
    try {
      const transactionResult = await this.transactionService.create(
        transactionDto,
        transaction,
      );
      this.logger.debug(
        { serviceFee, discount, type, id },
        'firstPaymentFree: ',
      );

      switch (type) {
        case CouponDiscountTypeEnum.COUPON:
          await this.updateUsedCoupon(
            transactionResult.couponId,
            createPaymentReqDto.couponCode,
            transaction,
          );
          break;
        case CouponDiscountTypeEnum.GIFT_CARD:
          await this.giftCardService.updateToUsed([id], transaction);
          break;
      }
      await this.updateOrderForPayment(
        orderDto.id,
        PaymentStatusEnum.SUCCESSFUL,
        transactionResult.id,
        transaction,
      );
      await this.createTicketSubmission(
        PaymentStatusEnum.SUCCESSFUL,
        order.tickets,
        transaction,
      );

      await transaction.commit();
      return order;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `firstPaymentZero error: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  // (目前只有 AFTEE 用到) 根據 paymentProvider 計算每個 user 的累計消費金額、累計消費次數，for 二階段成效金
  async calculatePaymentHistory(
    userUuid: string,
    provider: PaymentProviderEnum,
  ): Promise<{ totalAmountPaid: number; timesPaid: number }> {
    try {
      return (await this.transactionService.findAll({ userUuid }))
        .filter((t) => t.paymentProvider === provider && t.isSuccessful())
        .reduce(
          (acc, curr) => {
            return {
              totalAmountPaid: acc.totalAmountPaid + curr.totalAmount,
              timesPaid: acc.timesPaid + 1,
            };
          },
          { totalAmountPaid: 0, timesPaid: 0 },
        );
    } catch (e) {
      this.logger.warn({ message: e.message }, 'calculatePaymentHistory: ');
      return { totalAmountPaid: 0, timesPaid: 0 };
    }
  }

  // 二階段成效金(藍新)
  async secondPaymentForNewebpay(
    orderNo: string,
    confirmedAmount?: number,
  ): Promise<NewebpayReq> {
    const transaction = await this.sequelize.transaction();
    try {
      const { transactionDto, updatePaymentReq } =
        await this.buildTransactionForSecondPayment(
          orderNo,
          PaymentProviderEnum.NEWEBPAY,
          confirmedAmount,
        );
      await this.transactionService.create(transactionDto);
      const newebpayReq = (await this.paymentService.paymentData(
        PaymentProviderEnum.NEWEBPAY,
        updatePaymentReq,
      )) as NewebpayReq;
      await transaction.commit();

      return newebpayReq;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `secondPaymentForNewebpay error: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async secondPaymentForAftee(
    orderNo: string,
    successFee?: number,
  ): Promise<TransactionDto> {
    const transaction = await this.sequelize.transaction();

    try {
      const { transactionDto, updatePaymentReq } =
        await this.buildTransactionForSecondPayment(
          orderNo,
          PaymentProviderEnum.AFTEE,
          successFee,
        );
      // 更新 aftee 扣款額度
      const paymentRes = await this.paymentService.updatePayment(
        PaymentProviderEnum.AFTEE,
        updatePaymentReq,
      );
      // FIXME refactor
      transactionDto.token = paymentRes.token;
      transactionDto.providerTradeNo = paymentRes.providerTradeNo;
      transactionDto.payAt = paymentRes.payAt;
      transactionDto.status = paymentRes.status;
      transactionDto.error = paymentRes.error;
      // 建立新的交易
      const result = await this.transactionService.create(transactionDto);
      await transaction.commit();
      // FIXME 二次交易是及時返回，要開發票，之後改統一介面
      await this.issueInvoice(result.tradeNo);
      return result;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        'secondPaymentForAftee error: ',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async buildTransactionForSecondPayment(
    orderNo: string,
    paymentProvider: PaymentProviderEnum,
    successFee?: number,
  ): Promise<{
    transactionDto: TransactionDto;
    updatePaymentReq: UpdatePaymentReq;
  }> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderNo}`);

    const {
      id: orderId,
      user,
      firstStageTransaction,
      secondStageTransaction,
      tickets,
      ticketSubmissions,
    } = orderDto;
    if (!firstStageTransaction)
      throw new TicketException(`Order(${orderNo}) 第一階段服務費尚未付款`);
    if (firstStageTransaction.isFailed())
      throw new TicketException(`Order(${orderNo}) 第一階段服務費付款失敗`);
    if (secondStageTransaction?.isSuccessful())
      throw new TicketException(
        `Order(${orderNo}) 第二階段成效金已付款，無須重複扣款`,
      );
    const { username, uuid, email, phone } = user;

    const { amount } = await this.calculateOrderSecondPrice(
      tickets,
      ticketSubmissions,
      firstStageTransaction?.payAt,
    );

    const finalAmount = successFee || amount;
    if (!finalAmount)
      throw new TicketException(`Order(${orderNo}) 金額為 0, 無法付款`);

    // api 傳入的'已確認金額'，優先於程式計算出來的金額
    const transactionDto = TransactionBuilder.buildSecondTransaction(
      orderId,
      orderNo,
      username,
      uuid,
      email,
      phone,
      finalAmount,
      paymentProvider,
      this.successItem.description,
    );
    const { totalAmountPaid, timesPaid } = await this.calculatePaymentHistory(
      uuid,
      paymentProvider,
    );
    const updatePaymentReq = new UpdatePaymentReq({
      token: firstStageTransaction.token,
      providerTradeNo: firstStageTransaction.providerTradeNo,
      tradeNo: transactionDto.tradeNo,
      totalAmount: transactionDto.totalAmount,
      product: transactionDto.product,
      username: transactionDto.username,
      userUuid: transactionDto.userUuid,
      email: transactionDto.email,
      phone: transactionDto.phone,
      totalAmountPaid,
      timesPaid,
    });

    return { transactionDto, updatePaymentReq };
  }

  async checkOrderForFirstPayment(
    orderDto: OrderDto,
    userInfo?: UserInfo,
  ): Promise<OrderDto> {
    if (!orderDto)
      throw new NotfoundException(`Order not found: ${orderDto.id}`);
    if (!orderDto.user)
      throw new NotfoundException(`Order user not found: ${orderDto.userId}`);

    if (orderDto) this.checkDataBelong(userInfo, orderDto);

    // if (orderDto.isPaid())
    //   throw new TicketException(
    //     `Order(${orderId}) is paid, can't update`,
    //     ErrorTypes.ALREADY_PAID,
    //   );

    // 若一階段付款成功，則不可再次付款
    if (orderDto.isFirstStagePaid())
      throw new TicketException(
        `Order(${orderDto.id}) is paid, can't pay`,
        ErrorTypes.FIRST_PAYMENT_PAID,
      );

    // 若申訴成功 & 二階段未付款，則不給付款
    const ordersForSecondUnpaid = await this.getSecondUnpaidOrder(userInfo.id);
    if (CommonUtil.isArray(ordersForSecondUnpaid))
      throw new TicketException(
        `Order(${orderDto.id}) is not allowed to pay, before pay for all second stage payment`,
        ErrorTypes.OTHERS_SECOND_PAYMENT_UNPAID,
      );

    // if (orderDto.latestTransaction?.hasReceived()) {
    //   throw new TicketException(
    //     `Order(${orderId}) has already paid, can not pay again`,
    //     ErrorTypes.ALREADY_RECEIVED_PAYMENT,
    //   );
    // }
    this.checkOrderDeadline(orderDto.tickets, this.deadlineDays);
    return orderDto;
  }

  // 鎖定 coupon 並更新使用次數，更新完才解鎖
  async updateUsedCoupon(
    couponId: number,
    couponCode: string,
    transaction: Transaction,
  ): Promise<CouponDto> {
    if (!couponId || !couponCode) return;
    try {
      const locked = await this.redisService.acquireLock(
        'coupon',
        couponCode,
        5,
      );
      if (!locked)
        throw new TicketException(`Coupon(${couponCode}) can not acquire lock`);
      const couponDto = await this.couponService.findOneBy(
        { id: couponId },
        transaction,
      );
      if (couponDto.usageCount >= couponDto.totalCount)
        throw new TicketException(
          `Coupon(${couponCode}) usage count exceeded`,
          ErrorTypes.COUPON_LIMIT_EXCEEDED,
        );
      return this.couponService.update(
        couponId,
        { usageCount: couponDto.usageCount + 1 },
        transaction,
      );
    } finally {
      await this.redisService.releaseLock('coupon', couponCode);
    }
  }

  private checkOrderDeadline(tickets: TicketDto[], deadlineDays: number): void {
    // 若無未繳罰單直接放行
    // 只要有一筆未繳罰單，則檢查是否在期限內
    const remainingDays = TicketUtil.calculateRemainingDays(
      tickets,
      DateUtil.twDayjs()?.toDate(),
    );
    if (!remainingDays) return;
    if (remainingDays <= deadlineDays)
      throw new TicketException(
        `Tickets has reached the deadline(${deadlineDays} days) : ${tickets[0].expiresAt}`,
        ErrorTypes.EXPIRED,
      );
  }

  async updateOrderForDecision(
    id: number,
    userInfo: UserInfo,
    updateDto: OrderUpdateDto,
  ): Promise<OrderDto> {
    const original = await this.orderService.findOne(
      { id },
      false,
      true,
      false,
    );
    if (!original) throw new NotfoundException(`Order not found: ${id}`);
    this.checkDataBelong(userInfo, original);
    if (original.isFirstStagePaid()) {
      throw new TicketException(
        `Order(${id}) is paid/fail, can't update`,
        ErrorTypes.FIRST_PAYMENT_PAID,
      );
    }

    const updated = OrderUpdateDto.toOrderDto(updateDto);
    return this.updateOrder(id, updated);
  }

  async updateOrder(
    id: number,
    dto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    return this.orderService.update(id, dto, transaction);
  }

  // newebpay 每5秒會call 一次 notify，最多3次，多餘的 request 丟棄
  async paymentNotify(result: PaymentNotifyReq): Promise<void> {
    const paymentRes = this.paymentService.parsePaymentNotifyResult(result);
    if (!paymentRes)
      throw new TicketException(
        `paymentNotify failed: parsePaymentResult failed`,
      );

    // 防呆 newebpay 每5秒會call 一次 notify，最多3次，多餘的 request 丟棄，鎖 60s 不手動釋放
    // const pass = await this.redisService.acquireLock('paymentNotify', paymentResDto.tradeNo, 60);
    // if (!pass) {
    //   this.logger.warn({ tradeNo: paymentResDto.tradeNo }, 'duplicate paymentNotify, do nothing: ');
    //   return null;
    // }
    const transactionDto = await this.transactionService.findOneOrThrow(
      { tradeNo: paymentRes.tradeNo },
      true,
    );
    if (transactionDto.hasReceived()) {
      this.logger.warn(
        `tradeNo(${paymentRes.tradeNo}) paymentNotify duplicated`,
      );
      return;
    }
    // 確保每個 order 的 ticket 都有被辨識過，event 可避免處理時間過久
    await this.checkAndUpdateOrderRecognizedEvent(transactionDto.orderId);

    transactionDto.isSecondStage()
      ? await this.paymentNotifyForSecond(paymentRes)
      : await this.paymentNotifyForFirst(paymentRes);
  }

  async paymentNotifyForFirst(paymentRes: PaymentRes): Promise<void> {
    try {
      const orderDto = await this.updatePaymentResult(paymentRes);
      if (paymentRes.status === PaymentStatusEnum.SUCCESSFUL)
        await this.issueInvoice(paymentRes.tradeNo);

      this.logger.info({ paymentRes }, 'paymentNotify OK: ');
    } catch (e) {
      throw new TicketException(
        `tradeNo(${paymentRes.tradeNo}) paymentNotify failed: ${e.message}`,
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async paymentNotifyForSecond(paymentRes: PaymentRes): Promise<void> {
    const transaction = await this.sequelize.transaction();
    const { tradeNo, status } = paymentRes;

    try {
      const { orderId } = await this.transactionService.update(
        { tradeNo },
        TransactionBuilder.buildUpdatedTransaction(paymentRes),
        transaction,
      );
      const orderDto = await this.orderService.findOne(
        { id: orderId },
        false,
        true,
        false,
        transaction,
      );
      if (!orderDto)
        throw new TicketException(
          `Order not found: ${orderId}`,
          ErrorTypes.NOT_FOUND,
        );
      await transaction.commit();
      // FIXME: 二階段是否需要發票
      if (paymentRes.status === PaymentStatusEnum.SUCCESSFUL)
        await this.issueInvoice(paymentRes.tradeNo);

      this.logger.info({ paymentRes }, 'paymentNotify OK: ');
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `tradeNo(${paymentRes.tradeNo}) paymentNotify failed: ${e.message}`,
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async checkAndUpdateOrderRecognizedEvent(orderId: number): Promise<Job> {
    const job = await this.mqService.add(
      MqEnum.RECOGNIZE_QUEUE,
      { orderId },
      500,
    );
    this.logger.debug({ job }, 'added job: checkOrderRecognizedEvent');
    return job;
  }

  // 確保每個 order 都有辨識過，且會存辨識資料到其下的 ticket
  async checkAndUpdateOrderRecognized(orderId: number) {
    const tickets = await this.ticketService.findAll(
      { orderId },
      false,
      false,
      false,
    );
    const ticketIds = tickets.map((t) => t.id);
    for (const { id } of tickets) {
      const result = await this.recognizeTicket(true, id);
      if (!result) continue;
      // 更新 ticket & submission
      await this.ticketService.updateOnlyNullColumns(id, result as TicketDto);
      await this.ticketSubmissionRepository.updateOnlyNullColumns(
        { ticketId: id },
        result as TicketSubmissionDto,
      );
      this.logger.debug({ id }, 'checkAndUpdateOrderRecognized OK: ');
    }
    this.logger.info(
      { orderId, ticketIds },
      'checkOrderRecognized and update OK: ',
    );
  }

  async getPaymentReturnUrl(result: PaymentReturnReq): Promise<string> {
    try {
      // const { tradeNo, status } =
      //   this.paymentService.parsePaymentResult2(result);
      const paymentRes = this.paymentService.parsePaymentReturnResult(result);
      this.logger.debug({ paymentRes }, 'getPaymentReturnUrl: ');
      const { tradeNo, status } = paymentRes;
      const transactionDto = await this.transactionService.findOneOrThrow(
        { tradeNo },
        true,
      );
      const returnURL = this.parseReturnURL(transactionDto, status);
      this.logger.debug({ tradeNo, returnURL }, 'getPaymentReturnUrl: ');
      return returnURL;
    } catch (e) {
      // AFTEE 付款頁按 X 會導致異常，返回待付款清單頁
      this.logger.warn({ message: e.message }, 'getPaymentReturnUrl error: ');
      return paymentConfig().common.defaultReturnPage;
    }
  }

  // 檢查並建立 ticket
  async createBulkTicket(
    tickets: TicketDto[],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    if (!CommonUtil.isArray(tickets))
      throw new TicketException('Tickets is not array');
    for (const { ticketNo } of tickets) {
      await this.checkTicketNoDuplicated(ticketNo);
    }
    return this.ticketService.createBulk(tickets, transaction);
  }

  parseReturnURL(
    transactionDto: TransactionDto,
    status: PaymentStatusEnum,
  ): string {
    const { tradeNo, orderId, category, order } = transactionDto;
    if (!order)
      throw new TicketException(
        `tradeNo(${tradeNo}) transaction order not found`,
        ErrorTypes.NOT_FOUND,
      );

    // 免登入付款結果頁
    if (order.source === SourceEnum.NO_AUTH) {
      const url =
        status === PaymentStatusEnum.SUCCESSFUL
          ? paymentConfig().common.noAuthFirstSuccessReturnPage
          : paymentConfig().common.noAuthFirstErrorReturnPage;
      return url.replace(':orderNo', order.orderNo);
    }
    // 一般付款結果頁
    if (transactionDto.isFirstStage()) {
      const url =
        status === PaymentStatusEnum.SUCCESSFUL
          ? paymentConfig().common.firstSuccessReturnPage
          : paymentConfig().common.firstErrorReturnPage;
      return url.replace(':id', orderId.toString());
    } else if (transactionDto.isSecondStage()) {
      const url =
        status === PaymentStatusEnum.SUCCESSFUL
          ? paymentConfig().common.secondSuccessReturnPage
          : paymentConfig().common.secondErrorReturnPage;
      return url.replace(':orderNo', order.orderNo);
    } else
      throw new TicketException(
        `tradeNo(${tradeNo}) transaction category(${category}) is not supported`,
      );
  }

  async updateOrderForPayment(
    orderId: number,
    status: PaymentStatusEnum,
    transactionId?: number,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    const updatedOrder: Partial<OrderDto> = {
      paymentStatus: status,
      latestTransactionId: transactionId,
    };
    return this.updateOrder(orderId, updatedOrder, transaction);
  }

  // FIXME 目前還是會更新 order 的 payment_status & latest_transaction_id，之後要改用 first_transaction
  async updatePaymentResult(paymentRes: PaymentRes): Promise<OrderDto> {
    const { tradeNo, status } = paymentRes;

    const transaction = await this.sequelize.transaction();
    try {
      const { id, orderId, couponId, giftCardId } =
        await this.transactionService.update(
          { tradeNo },
          TransactionBuilder.buildUpdatedTransaction(paymentRes),
          transaction,
        );

      if (couponId) {
        const { code } = await this.couponService.findOneBy(
          { id: couponId },
          transaction,
        );
        await this.updateUsedCoupon(couponId, code, transaction);
      } else if (giftCardId) {
        await this.giftCardService.updateToUsed([giftCardId], transaction);
      }

      const orderDto = await this.orderService.findOne(
        { id: orderId },
        false,
        true,
        false,
        transaction,
      );
      if (!orderDto)
        throw new TicketException(
          `Order not found: ${orderId}`,
          ErrorTypes.NOT_FOUND,
        );
      await this.createTicketSubmission(status, orderDto.tickets, transaction);

      const order = await this.updateOrderForPayment(
        orderId,
        status,
        id,
        transaction,
      );
      await transaction.commit();
      return order;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        `tradeNo(${tradeNo}) updateTransactionAndOrder failed: ${e.message}`,
        undefined,
        e,
      );
    }
  }

  async createTicketSubmission(
    status: PaymentStatusEnum,
    tickets: TicketDto[],
    transaction?: Transaction,
  ) {
    if (
      status === PaymentStatusEnum.SUCCESSFUL &&
      CommonUtil.isArray(tickets)
    ) {
      for (const ticket of tickets) {
        const ticketSubmissionDto =
          await this.ticketSubmissionRepository.findOneBy(
            { ticketId: ticket.id },
            true,
            transaction,
          );
        if (ticketSubmissionDto)
          throw new TicketException(
            `Ticket(${ticket.id}) submission already exists`,
            ErrorTypes.DUPLICATED,
          );
        await this.ticketSubmissionRepository.create(
          TicketDto.buildSubmission(ticket),
          transaction,
        );
      }
      // await Promise.all(
      //   tickets.map((ticket) =>
      //     this.ticketSubmissionProvider.create(TicketDto.buildSubmission(ticket), transaction),
      //   ),
      // );
    }
  }

  async issueInvoice(tradeNo: string): Promise<any> {
    try {
      const transactionDto = await this.transactionService.findOneOrThrow({
        tradeNo,
      });
      const { status, invoiceNo, invoiceRandomNo, invoiceAt, error } =
        await this.invoiceService.issue(
          TransactionBuilder.buildEzpayReq(transactionDto),
        );
      const twInvoiceAt =
        status === PaymentStatusEnum.SUCCESSFUL && (invoiceAt || new Date());
      this.logger.debug(
        { tradeNo, invoiceNo, invoiceRandomNo, twInvoiceAt },
        'issueInvoice and parse OK: ',
      );
      const transactionResult = await this.transactionService.update(
        { tradeNo },
        {
          invoiceNo,
          invoiceRandomNo,
          invoiceAt: twInvoiceAt,
          error,
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

  // 檢查 order progress 為特定情況下，ticketNo 是否重複
  async checkTicketNoDuplicated(newTicketNo: string, originalId?: number) {
    if (!newTicketNo) return;
    let tickets = await this.ticketService.findAll(
      { ticketNo: newTicketNo, isDraft: false },
      true,
      true,
      false,
    );
    tickets = originalId ? tickets.filter((t) => t.id !== originalId) : tickets;
    if (!CommonUtil.isArray(tickets)) return;

    const isDuplicated = tickets.some((t) => this.isDuplicated(t));
    if (isDuplicated)
      throw new TicketException(
        `TicketNo ${newTicketNo} is duplicated`,
        ErrorTypes.DUPLICATED,
      );
  }

  isDuplicated(t: TicketDto): boolean {
    if (!t) return false;
    const { orderDto, ticketSubmissionDto } = t;
    switch (orderDto?.paymentStatus) {
      case PaymentStatusEnum.SUCCESSFUL: {
        // 申訴成功的就無需再申訴 歸類為重複
        if (ticketSubmissionDto?.appealResult === AppealResultEnum.APPROVED)
          return true;

        if (!orderDto?.progress) return true;
        switch (orderDto?.progress) {
          case ProgressEnum.INCOMPLETE:
          case ProgressEnum.PROCESSING:
          case ProgressEnum.SUBMITTED:
            return true;
          default:
            return false;
        }
      }
      case PaymentStatusEnum.FAILED: {
        try {
          this.checkOrderDeadline([t], this.deadlineDays);
          return false;
        } catch (e) {
          return true;
        }
      }
      default:
        return true;
    }
  }

  async recognizeTicket(
    skipWhenExists: boolean,
    ticketId: number,
    userInfo?: UserInfo,
    transaction?: Transaction,
  ): Promise<any> {
    const ticketDto = await this.findTicketById(ticketId, userInfo, true);
    // 跳過已辨識過的資料
    if (skipWhenExists && ticketDto.isRecognizeLogExists()) return;
    this.checkDataBelong(userInfo, ticketDto);

    const paths1 = ticketDto.ticketInfoFiles.map((file) => file.path);
    const paths2 = ticketDto.violationFiles.map((file) => file.path);
    const paths = _.concat(paths1, paths2);
    const result = await this.recognitionService.recognize(paths);
    try {
      const recognizeLogDto = await this.recognizeLogService.create(
        TicketDto.buildRecognizeLog(ticketDto, result),
        transaction,
      );
      this.logger.info('recognizeTicket create OK: ', recognizeLogDto.id);
    } catch (e) {
      // 存 log 不能影響流程
      this.logger.error({ error: e.message }, 'recognizeTicket.create error:');
    }
    return result;
  }

  // 複製一筆罰單 含 ticket & submission & recognizeLog
  async duplicateTicket(id: number, newTicketNo: string): Promise<TicketDto> {
    const transaction = await this.sequelize.transaction();
    try {
      const ticket = await this.ticketService.findOne(
        { id },
        false,
        false,
        false,
        transaction,
      );
      if (!ticket) throw new NotfoundException(`Ticket not found: ${id}`);
      ticket.ticketNo = newTicketNo;
      const newTicket = await this.ticketService.create(ticket, transaction);
      this.logger.debug({ newTicketNo }, 'duplicateTicket create ticket OK: ');

      const ticketSubmission = await this.ticketSubmissionRepository.findOneBy(
        { ticketId: id },
        false,
        transaction,
      );
      if (ticketSubmission) {
        ticketSubmission.ticketNo = newTicketNo;
        ticketSubmission.ticketId = newTicket.id;
        await this.ticketSubmissionRepository.create(
          ticketSubmission,
          transaction,
        );
        this.logger.debug('duplicateTicket create ticketSubmission OK ');
      }

      const recognizeLog = await this.recognizeLogService.findOneLatest(
        { ticketId: id },
        transaction,
      );
      if (recognizeLog) {
        recognizeLog.ticketId = newTicket.id;
        recognizeLog.result = { ...recognizeLog.result, ticketNo: newTicketNo };
        await this.recognizeLogService.create(recognizeLog, transaction);
        this.logger.debug('duplicateTicket create recognizeLog OK ');
      }

      await transaction.commit();
      return newTicket;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(`duplicateTicket error: ${e.message}`);
    }
  }

  checkDataBelong(userInfo: UserInfo, { userId }: any): boolean {
    // 傳入參數為空都不檢查
    if (!userInfo || !userId) return true;

    // 只檢查有 userId 的資料
    if (userInfo.role === RoleEnum.ADMIN) return true;
    if (userId != userInfo.id)
      throw new TicketException(
        `Data(userId:${userId}) not belong to user(${userInfo})`,
        ErrorTypes.UNAUTHORIZED,
      );
    return true;
  }

  async findTicketSubmissionBy(
    where: Partial<TicketSubmissionDto>,
    includeOrder: boolean,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.ticketSubmissionRepository.findOneBy(
      where,
      includeOrder,
      transaction,
    );
  }

  async notifyOnBotFailed(): Promise<MailLogDto> {
    const ticketSubmissions = await this.ticketSubmissionRepository.findAllBy(
      { botSubmittedStatus: BotSubmittedStatusEnum.FAILED },
      false,
    );
    if (!CommonUtil.isArray(ticketSubmissions)) return null;

    ticketSubmissions.map((dto) => dto.ticketNo);
    return this.mailLogService.sendTemplate(
      new SendMailTemplateReq({
        to: this.systemReceiver,
        subject: `[系統通知] 送件機器人失敗，共 ${ticketSubmissions.length} 筆`,
        template: 'system-bot-failed-notify',
        tag: 'system-bot-failed-notify',
        context: {
          ticketSubmissions,
        },
      }),
      MailLogCategory.CRAWLER_BOT_FAILED,
    );
  }

  async notifyOnIncompleteOrder(): Promise<MailLogDto[]> {
    // 找出未過期的訂單
    let orders = await this.orderService.findAll(
      {
        paymentStatus: PaymentStatusEnum.SUCCESSFUL,
        progress: ProgressEnum.INCOMPLETE,
      },
      true,
      true,
      true,
    );
    // 找出未過期的訂單
    orders = orders.filter(
      (order) =>
        DateUtil.diffTaipei(order.getEarliestExpiresAt(), new Date(), 'days') >
        0,
    );
    if (!CommonUtil.isArray(orders)) return;
    this.logger.debug({ length: orders.length }, 'notifyOnIncompleteOrder: ');
    // this.logger.debug({ orders }, 'notifyOnIncompleteOrder: ');

    const returnPage = paymentConfig().common.noAuthFirstSuccessReturnPage;

    const map = orders.map(
      async ({ orderNo, email, ticketSubmissions, user }) => {
        return this.mailLogService.sendTemplate(
          new SendMailTemplateReq({
            to: email,
            subject: '[系統通知] 請儘速補齊罰單資料，避免喪失權益',
            template: 'ticket-notify-incomplete-order',
            tag: 'ticket-notify-incomplete-order',
            context: {
              ticketSubmissions,
              url: `${returnPage.replace(':orderNo', orderNo)}?lineUid=${user.lineUid}`,
            },
          }),
          MailLogCategory.PROGRESS_INCOMPLETE,
        );
      },
    );
    return Promise.all(map);
  }

  async sendSecondPaymentMail(): Promise<MailLogDto> {
    const ticketSubmissions = await this.ticketSubmissionRepository.findAllBy(
      { botSubmittedStatus: BotSubmittedStatusEnum.FAILED },
      false,
    );
    if (!CommonUtil.isArray(ticketSubmissions)) return null;

    ticketSubmissions.map((dto) => dto.ticketNo);
    return this.mailLogService.sendTemplate(
      new SendMailTemplateReq({
        to: this.systemReceiver,
        subject: `[系統通知] 送件機器人失敗，共 ${ticketSubmissions.length} 筆`,
        template: 'system-bot-failed-notify',
        tag: 'system-bot-failed-notify',
        context: { ticketSubmissions },
      }),
      MailLogCategory.CRAWLER_BOT_FAILED,
    );
  }

  async checkTicketPenalty({
    violation1Article,
    violation1Item,
    violation1Clause,
    violation1Penalty,
    violation2Article,
    violation2Item,
    violation2Clause,
    violation2Penalty,
  }: TicketDto): Promise<boolean> {
    const check1 = await this.checkPenalty(
      violation1Article,
      violation1Item,
      violation1Clause,
      violation1Penalty,
    );
    const check2 = await this.checkPenalty(
      violation2Article,
      violation2Item,
      violation2Clause,
      violation2Penalty,
    );
    return check1 && check2;
  }

  async checkPenalty(
    article: string,
    item: string,
    clause: string,
    penalty: string,
  ): Promise<boolean> {
    // FIXME penalty 沒有填：通過
    if (!penalty) return true;
    const penaltyDto = await this.penaltyRepository.findOne({
      article: article,
      item: item,
      clause: clause,
    });
    // TODO 不一定找得到罰則罰金
    if (!penaltyDto) return true;
    const penaltyAmount = _.toSafeInteger(penalty);
    return penaltyDto.inRange(penaltyAmount);
  }

  async calculateTicketFirstAmount(
    ticket: TicketDto,
    recognizeLog: RecognizeLogDto,
    defaultAmount: number = this.serviceItem.amount,
  ): Promise<{ amount: number; remark?: string }> {
    const { fine, remark } = await this.parseTicketFine(ticket, recognizeLog);
    return {
      amount: fine ? TicketUtil.calculateServiceFee(fine) : defaultAmount,
      remark,
    };
  }

  async calculateTicketSecondAmount(
    submission: TicketSubmissionDto,
    payAt: Date,
    penaltySuccessFee: number,
    successFeeRate: number = this.successFeeRate,
    secondPaymentStartDate: Date = this.secondPaymentStartDate,
    successFeeRate2: number = this.successFeeRate2,
    secondPaymentStartDate2: Date = this.secondPaymentStartDate2,
  ): Promise<OrderSecondPriceDto> {
    if (!submission) throw new TicketException('ticket_submission not found');
    // const { fine, remark } = await this.parseTicketFine(ticket, recognizeLog);
    const violationFine = submission.violationFine;
    const appealViolationFine = submission.appealViolationFine;
    let reducedFine: number;
    let penaltyCount = 0;
    if (violationFine || appealViolationFine)
      reducedFine = (violationFine || 0) - (appealViolationFine || 0);
    if (submission.violation1Penalty) penaltyCount++;
    if (submission.violation2Penalty) penaltyCount++;

    const rate = TicketUtil.calculateSuccessFeeRate(
      payAt,
      successFeeRate,
      secondPaymentStartDate,
      successFeeRate2,
      secondPaymentStartDate2,
    );

    const amount = TicketUtil.calculateSuccessFee(
      reducedFine,
      rate,
      penaltyCount,
      penaltySuccessFee,
    );

    return {
      violationFine,
      appealViolationFine,
      reducedFine,
      penaltyCount,
      amount,
      percentage: rate * 100,
    };
  }

  // 必須用 ticket，因為付款前不會有 ticketSubmission
  async parseTicketFine(
    ticket: TicketDto,
    recognizeLog: RecognizeLogDto,
  ): Promise<TicketFineDto> {
    try {
      if (!ticket) throw new TicketException('找不到罰單 => 原價');
      if (!recognizeLog) throw new TicketException('找不到辨識結果 => 原價');
      const { violation1Article: userArticle1, violationFine: userFine } =
        ticket;
      const { violation1Article: aiArticle1, violationFine: aiFine } =
        recognizeLog.result;
      // 若無AI辨識法條，返回預設值
      if (!aiArticle1) throw new TicketException('無 AI 辨識法條 => 原價');

      // 若使用者與AI辨識法條不同，返回預設值
      if (userArticle1 !== aiArticle1)
        throw new TicketException(
          `使用者法條：${userArticle1}, AI辨識法條：${aiArticle1}, 兩種法條不同 => 原價`,
        );

      // 查法條表
      // FIXME 目前只查條，之後可能補上項款的相容？
      // FIXME 改用cache？
      const penaltyDto = await this.penaltyRepository.findOne({
        article: userArticle1,
        // item: userItem1,
        // clause: userClause1,
      });
      if (!penaltyDto)
        throw new TicketException(`法條：${userArticle1} 不在法條表內 => 原價`);
      const { minAmount, maxAmount } = penaltyDto;

      let fine: number;
      if (aiFine) {
        this.logger.debug(
          { aiFine, minAmount, maxAmount },
          'calculate aiFine: ',
        );
        fine = this.calculateFine(aiFine, minAmount, maxAmount);
        if (!fine)
          throw new TicketException(`AI罰金：${aiFine} 不在法條表內 => 原價`);
      } else if (userFine) {
        this.logger.debug(
          { userFine, minAmount, maxAmount },
          'calculate userFine: ',
        );
        fine = this.calculateFine(userFine, minAmount, maxAmount);
        if (!fine)
          throw new TicketException(
            `使用者罰金：${userFine} 不在法條表內 => 原價`,
          );
      }
      this.logger.debug({ ticketId: ticket.id, fine }, 'calculateTicketFine: ');
      return { fine };
    } catch (e) {
      this.logger.warn({ message: e.message }, 'calculateTicketFine: ');
      return {
        remark: `ticketId:${ticket?.id}, ${e.message}`,
      };
    }
  }

  calculateFine(fine: number, min: number, max: number): number {
    const inRange = fine >= min && fine <= max;
    return inRange ? fine : null;
  }

  async calculatePenaltyPrice(
    article: string,
    item: string,
    clause: string,
    fine: number,
    defaultAmount: number,
  ): Promise<number> {
    if (_.isEmpty(article)) return defaultAmount;

    // FIXME 用cache?
    const penaltyDto = await this.penaltyRepository.findOne({
      article: article,
      item: item,
      clause: clause,
    });
    // 找不到罰則罰金：用原價
    if (!penaltyDto) return defaultAmount;

    const inRange = penaltyDto.inRange(fine);
    if (!inRange) return defaultAmount;
    return fine > 0 ? fine * this.successFeeRate : defaultAmount;
  }

  async getOrderForSecond(orderNo: string): Promise<OrderPublicDto> {
    const orderDto = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderNo}`);

    return new OrderPublicDto(orderDto);
  }

  async getSecondUnpaidOrder(userId: number): Promise<OrderDto[]> {
    const orderDtos = await this.orderService.findAll(
      { userId },
      true,
      true,
      true,
    );
    if (!CommonUtil.isArray(orderDtos)) return [];
    return orderDtos.filter((o) =>
      o.isSecondPaymentUnpaid(this.secondPaymentStartDate),
    );
  }

  //FIXME 之後要加退款時間
  async cancelPayment({ tradeNo }: TransactionCancelReq) {
    // 找原始交易紀錄
    const { providerTradeNo, paymentProvider } =
      await this.transactionService.findOneOrThrow({ tradeNo });
    const cancelPaymentReq = new CancelPaymentReq({
      id: providerTradeNo,
      paymentProvider,
    });
    // 取消交易
    const cancelPaymentRes =
      await this.paymentService.cancelPayment(cancelPaymentReq);
    // 更新交易紀錄
    const updatedDto =
      TransactionBuilder.buildTransactionForCancel(cancelPaymentRes);
    await this.transactionService.update({ tradeNo }, updatedDto);
  }

  async updateTicketByMvdis(submissions: TicketSubmissionDto[]) {
    if (!CommonUtil.isArray(submissions)) {
      this.logger.debug('fetchMvdis skip: no submissions');
      return;
    }
    // 增加罰單代查
    const isTicketUnpaid = submissions.some((t) => !t.isTicketPaid);
    if (!isTicketUnpaid) {
      this.logger.debug('fetchMvdis skip: all tickets are paid');
      return;
    }

    const mvdisListResDtos = await this.mvdisService.findMvdisTickets(
      submissions[0]?.userId,
    );
    if (!CommonUtil.isArray(mvdisListResDtos)) {
      this.logger.debug('fetchMvdis skip: no mvdisListResDtos');
      return;
    }
    for (const { mvdisTickets } of mvdisListResDtos) {
      for (const mvdisTicket of mvdisTickets) {
        // 過濾掉不存在的罰單
        if (submissions.every((t) => t.ticketNo !== mvdisTicket.vilTicket))
          continue;

        const transaction = await this.sequelize.transaction();
        try {
          const ticketDto = await this.parseMvdisToTicket(mvdisTicket);

          await this.ticketService.update(ticketDto.id, ticketDto);
          await this.ticketSubmissionService.updateBulk(
            { ticketId: ticketDto.id },
            ticketDto,
          );
          this.logger.debug(
            { mvdisTicket, ticketDto },
            'fetchMvdis updateTicket OK: ',
          );
          await transaction.commit();
        } catch (e) {
          await transaction.rollback();
          throw new TicketException(
            `tradeNo(${mvdisTicket.vilTicket}) updateTicket failed: ${e.message}`,
            ErrorTypes.SERVER_ERROR,
            e,
          );
        }
      }
    }
  }

  async parseMvdisToTicket(
    mvdisDto: Partial<MvdisTicketResDto>,
  ): Promise<TicketDto> {
    const necessaryDto = {
      vilDate: mvdisDto.vilDate,
      vilFact: mvdisDto.vilFact,
      arrivedDate: mvdisDto.arrivedDate,
      vilTicket: mvdisDto.vilTicket,
      plateNo: mvdisDto.plateNo,
      penalty: mvdisDto.penalty,
      law: mvdisDto.law,
      office: mvdisDto.office,
    } as MvdisTicketResDto;

    const prompt = `
    You are tasked with processing a traffic ticket document (交通罰單) represented as a JSON string of an MvdisTicketResDto object. Your goal is to extract specific information and convert it into a TicketDto object. The conversion must adhere to the following specifications:

1. **Input Format**:
   - The input will be a JSON string representing an instance of MvdisTicketResDto.

2. **Required Fields**:
   - Ensure that all enum fields in the TicketDto are filled. The required enum fields include:
     - assignedOfficeCity
     - vehicleType
     - violationFactType

3. **Extracting Information**:
   - Extract the following fields from the MvdisTicketResDto JSON:
     - vilDate (map to violateAt)
     - vilFact (map to violationFact)
     - arrivedDate (if applicable, map to driverName)
     - vilTicket (map to ticketNo)
     - plateNo (map to licensePlateNo)
     - penalty (map to violationFine)
     - office (map to assignedOfficeCity)
     - vilFact (map to violationFactType)
     - law (map to these columns by different format: 
        * format1: 第xx條第xx款第xx項
            * columns: violation1Article, violation1Item, violation1Clause
        * format2: 第xx條第xx項第xx款第yy條第yy項第yy款"
            (xx for violation1, yy for violation2)
            * columns: violation1Article, violation1Item, violation1Clause, violation2Article, violation2Item, violation2Clause
        )
        * if only Article like : 第xx條, just export to violation1Article
     - other relevant fields as necessary

4. **Finding the Most Relevant violationFactType**:
   - Based on the extracted vilFact and the possible articles defined in the provided enum, determine the most relevant violationFactType. Use keywords and context to find the best match.

5. **Final JSON Output Structure**:
   - Construct the TicketDto object using the extracted and transformed data.
   - Ensure that the final output conforms to the TicketDto schema provided.
`;
    const recognizedResult = await this.recognitionService.parseResultByAi(
      JSON.stringify(necessaryDto),
      prompt,
    );
    const ticketAiResult = new TicketDto(recognizedResult);
    const ticketResult = this.parseMvdisResultByRegex(mvdisDto, ticketAiResult);
    this.logger.debug(
      { mvdisDto, ticketRegexResult: ticketResult },
      'parseMvdisResultByAi: ',
    );
    return ticketResult;
  }

  parseMvdisResultByRegex(
    mvdis: Partial<MvdisTicketResDto>,
    ticket: TicketDto,
  ): TicketDto {
    ticket.isTicketAssignedToDriver = mvdis.respTp.includes('駕駛人');
    ticket.violateAt = DateUtil.twDayjs(mvdis.vilDate).toDate();
    ticket.expiresAt = DateUtil.twDayjs(mvdis.arrivedDate).toDate();
    // let vehicleType: VehicleTypeEnum;
    // switch (mvdis.vehKind) {
    //   case '1':
    //     vehicleType = VehicleTypeEnum.SMALL_PASSENGER_CARGO;
    //     break;
    //   case '2':
    //     //TODO
    //     break;
    //   case '3':
    //     vehicleType = VehicleTypeEnum.MOTORCYCLE;
    //     break;
    // }
    return ticket;
  }
}
