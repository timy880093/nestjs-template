import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TicketAppealService } from '../ticket/shared/ticket-appeal.service';
import { TicketService } from '../ticket/service/ticket.service';
import { CreateSimpleTicketReq } from './dto/create-simple-ticket.req';
import { UsersService } from '../users/users.service';
import { TicketException } from '../../common/exception/ticket.exception';
import { OrderService } from '../ticket/service/order.service';
import { OrderDto } from '../ticket/dto/order.dto';
import {
  FirstPaymentReq,
  PaymentProviderEnum,
  PaymentReturnReq,
  PaymentStatusEnum,
} from '../../third-party/payment/dto';
import { ProgressEnum } from '../ticket/enums/order.enum';
import { SourceEnum } from '../../common/dto/source.enum';
import { OrderFirstPriceDto } from '../ticket/dto/order-price.dto';
import { CouponDiscountDto } from '../ticket/dto/coupon-discount.dto';
import { CreatePaymentReqDto } from '../ticket/dto/create-payment.req.dto';
import { Sequelize } from 'sequelize-typescript';
import paymentConfig from '../../third-party/payment/payment.config';
import { UpdateSimpleTicketReq } from './dto/update-simple-ticket.req';
import { CommonUtil } from '../../common/util';
import { TicketSubmissionService } from '../ticket/service/ticket-submission.service';
import { UploadService } from '../upload/upload.service';
import { UploadFilesDto } from '../upload/dto/upload-files.dto';
import { TrackEventEnum } from '../../common/dto/track-event.enum';
import { ErrorTypes } from '../../common/dto/error-code.const';
import { StatisticService } from '../statistic';

@Injectable()
export class NoAuthService {
  private readonly newebpayReturnURL: string;
  private readonly afteeReturnURL: string;

  constructor(
    @InjectPinoLogger(NoAuthService.name) private readonly logger: PinoLogger,
    private readonly ticketAppealService: TicketAppealService,
    private readonly ticketService: TicketService,
    private readonly ticketSubmissionService: TicketSubmissionService,
    private readonly usersService: UsersService,
    private readonly orderService: OrderService,
    private readonly uploadService: UploadService,
    private readonly statisticService: StatisticService,
    private readonly sequelize: Sequelize,
  ) {
    this.newebpayReturnURL = paymentConfig().newebpay.noAuthReturnURL;
    this.afteeReturnURL = paymentConfig().aftee.noAuthReturnURL;
  }

  // FIXME 優化: 可改成 event
  // private async addEventTimes(event: TrackEventEnum): Promise<number> {
  //   const date = DateUtil.twDayjs().toISOString().slice(0, 10);
  //   const key = `${RedisGroupEnum.TRACK_EVENT}:${date}`;
  //   // await this.redisService.acquireLock(group, key, 5);
  //   try {
  //     // const times = await this.redisService.get(group, key);
  //     // const newTimes = Number(times) + 1;
  //     // await this.redisService.set(group, key, newTimes);
  //     return this.redisService.hincrby(key, String(event));
  //     // return newTimes;
  //   } catch (e) {
  //     this.logger.warn({ key, message: e.message }, 'addEventTimes error: ');
  //   }
  //   // finally {
  //   //   await this.redisService.releaseLock(group, key);
  //   // }
  // }

  async recordSuccessEvent(event: TrackEventEnum): Promise<void> {
    await this.statisticService.recordSuccessEvent(event);
  }

  // 根據 lineUid, email 建立 ticket，再根據 dto 建立 ticket/order
  async createTicketsAndOrder(
    lineUid: string,
    req: CreateSimpleTicketReq,
    source: SourceEnum = SourceEnum.NO_AUTH,
  ): Promise<OrderDto> {
    const { email, phone, ref } = req;
    const transaction = await this.sequelize.transaction();
    try {
      // 根據 email, lineUid 取得 or 建立 user
      const user = await this.usersService.findOrCreate(
        {
          lineUid,
          source,
          email,
          phone,
          ref,
        },
        transaction,
      );
      const order = await this.orderService.create(
        {
          userId: user.id,
          progress: ProgressEnum.INCOMPLETE,
          paymentStatus: PaymentStatusEnum.FAILED,
          source,
          email,
          phone,
        },
        transaction,
      );
      this.logger.debug({ order }, 'createTicketsAndOrder order: ');

      const newTickets = req.toTickets(user.id, order.id, source);
      // this.logger.debug({ newTickets }, 'createTicketsAndOrder tickets2: ');
      const existsTickets =
        await this.ticketService.findAllForDuplicatedTicketNos(
          newTickets.map((t) => t.ticketNo),
          transaction,
        );
      if (existsTickets.length > 0) {
        // 找出重複的
        const duplicatedTicketNos = newTickets
          .filter((t) => existsTickets.find((t) => t.ticketNo === t.ticketNo))
          .map((t) => t.ticketNo);
        throw new TicketException(
          'TicketNo is duplicated: ' + duplicatedTicketNos.join(','),
          ErrorTypes.TICKET_NO_DUPLICATED,
        );
      }

      await this.ticketAppealService.createBulkTicket(newTickets, transaction);
      this.logger.debug(
        { ticketNos: newTickets.map((t) => t.ticketNo) },
        'createTicketsAndOrder newTickets: ',
      );
      await transaction.commit();
      this.logger.debug({ lineUid, req }, 'createTicketsAndOrder');
      await this.statisticService.recordSuccessEventVoid(
        TrackEventEnum.CLICK_CREATE_TICKET,
      );

      return order;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        'createTicketsAndOrder error: ' + e.message,
        undefined,
        e,
      );
    }
  }

  // 補齊資料，寫入 user_completed_at
  async updateTicketsAndOrder(
    lineUid: string,
    orderNo: string,
    req: UpdateSimpleTicketReq,
  ): Promise<OrderDto> {
    const user = await this.usersService.findOneByLineUid(lineUid);
    if (!user) throw new TicketException('User not found');

    const order = await this.orderService.findOne(
      { orderNo },
      true,
      true,
      true,
    );
    if (!order) throw new TicketException('Order not found');
    if (!CommonUtil.isArray(order.tickets))
      throw new TicketException('Ticket not found');
    if (order.progress !== ProgressEnum.INCOMPLETE)
      throw new TicketException('progress must be incomplete');

    const ticketIds = order.tickets.map((t) => t.id);
    const transaction = await this.sequelize.transaction();
    try {
      const ticketResults = await this.ticketService.updateBulk(
        ticketIds,
        req.toTicket(),
      );
      this.logger.debug(
        { ticketResults: ticketResults.map((t) => t.id) },
        'updated tickets: ',
      );

      const ticketSubmissionResults =
        await this.ticketSubmissionService.updateBulkByTicketIds(
          ticketIds,
          req.toTicket(),
        );
      this.logger.debug(
        { ticketSubmissionResults: ticketSubmissionResults.map((t) => t.id) },
        'updated ticketSubmissions: ',
      );
      const orderResult = await this.orderService.update(
        order.id,
        req.toOrder(),
      );
      await transaction.commit();
      // 紀錄事件次數
      await this.statisticService.recordSuccessEventVoid(
        TrackEventEnum.CLICK_UPDATE_TICKET,
      );
      // 非同步罰單代查並回寫
      void this.ticketAppealService.updateTicketByMvdis(
        ticketSubmissionResults,
      );

      return orderResult;
    } catch (e) {
      await transaction.rollback();
      throw new TicketException(
        'updateTicketAndOrder error: ' + e.message,
        undefined,
        e,
      );
    }
  }

  async getOrders(
    lineUid: string,
    paymentStatus: string,
    progress: string,
  ): Promise<OrderDto[]> {
    const user = await this.usersService.findOneByLineUid(lineUid);
    if (!user) throw new TicketException('User not found');

    const orders = await this.orderService.findOrdersByPaymentStatus(
      { userId: user.id, source: SourceEnum.NO_AUTH },
      paymentStatus,
      progress,
    );
    await this.checkOwnerLineUid(lineUid, orders);
    return orders;
  }

  async getOrderForPayment(
    lineUid: string,
    orderNo: string,
  ): Promise<OrderDto> {
    const order = await this.orderService.findOne(
      { orderNo, source: SourceEnum.NO_AUTH },
      true,
      true,
      true,
    );
    await this.checkOwnerLineUid(lineUid, order);
    return order;
  }

  async getFirstPrice(orderNo: string): Promise<OrderFirstPriceDto> {
    return this.ticketAppealService.getFirstPriceByOrderNo(orderNo);
  }

  async getCouponDiscount(
    lineUid: string,
    couponCode: string,
  ): Promise<CouponDiscountDto> {
    const { id } = await this.usersService.findOneByLineUid(lineUid);
    const couponDiscountDto = await this.ticketAppealService.getCouponDiscount(
      id,
      couponCode,
    );
    if (!couponDiscountDto.id)
      throw new TicketException(couponDiscountDto.description);
    return couponDiscountDto;
  }

  async firstPayment(
    lineUid: string,
    orderNo: string,
    req: CreatePaymentReqDto,
  ): Promise<FirstPaymentReq> {
    const returnURL = await this.parseReturnURL(req.paymentProvider);
    const result = await this.ticketAppealService.firstPaymentByOrderNo(
      orderNo,
      req,
      returnURL,
    );
    await this.statisticService.recordSuccessEventVoid(
      TrackEventEnum.CLICK_PAYMENT,
    );
    return result;
  }

  async parseReturnURL(paymentProvider: PaymentProviderEnum): Promise<string> {
    switch (paymentProvider) {
      case PaymentProviderEnum.NEWEBPAY:
        return this.newebpayReturnURL;
      case PaymentProviderEnum.AFTEE:
        return this.afteeReturnURL;
    }
  }

  async firstPaymentFree(
    lineUid: string,
    orderNo: string,
    req: CreatePaymentReqDto,
  ): Promise<OrderDto> {
    const result = await this.ticketAppealService.firstPaymentFreeByOrderNo(
      orderNo,
      req,
    );
    await this.statisticService.recordSuccessEventVoid(
      TrackEventEnum.CLICK_PAYMENT,
    );
    return result;
  }

  async checkOwnerLineUid(lineUid: string, data: any): Promise<boolean> {
    const dataUserId = data?.userId;
    if (!dataUserId) return true;
    const user = await this.usersService.findOneByLineUid(lineUid);
    if (!user) throw new TicketException('User not found');
    if (user.id !== dataUserId)
      throw new TicketException(
        `User(${user.id}) and data userId(${dataUserId}) not match`,
      );
  }

  async getPaymentReturnUrl(req: PaymentReturnReq): Promise<string> {
    return this.ticketAppealService.getPaymentReturnUrl(req);
  }

  async uploadFile(
    lineUid: string,
    file: Express.Multer.File,
  ): Promise<UploadFilesDto> {
    const user = await this.usersService.findOneByLineUid(lineUid);
    return this.uploadService.upload(user?.id, file);
  }
}
