import { Injectable } from '@nestjs/common';
import { OrderDto } from '../dto/order.dto';
import { NotfoundException } from '../../../common/exception/notfound.exception';
import { Transaction, WhereOptions } from 'sequelize';
import { OrderRepository } from '../repository/order.repository';
import { UploadService } from '../../upload/upload.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CommonUtil } from '../../../common/util';
import { PaymentStatusEnum } from '../../../third-party/payment/dto';
import { OrderBuilder } from '../utils/order-builder';
import { TicketException } from '../../../common/exception/ticket.exception';
import { ProgressEnum } from '../enums/order.enum';
import { TrackEventDto } from '../dto/track-event.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectPinoLogger(OrderService.name) private readonly logger: PinoLogger,
    private orderRepository: OrderRepository,
    private uploadService: UploadService,
  ) {}

  async findOrdersByPaymentStatus(
    where: Partial<OrderDto>,
    paymentStatusString?: string,
    progressString?: string,
  ): Promise<OrderDto[]> {
    let orders = await this.findAll(where, false, true, true, [
      ['updated_at', 'DESC'],
    ]);
    // paymentStatus 和 progress 不能同時查詢
    if (paymentStatusString) {
      const statusArray = paymentStatusString
        .split(',')
        .map((status) => CommonUtil.stringToEnum(PaymentStatusEnum, status));
      orders = orders.filter((o) =>
        statusArray.includes(o.getFirstStagePaymentStatus()),
      );
    } else if (progressString) {
      const progressArray = progressString
        .split(',')
        .map((progress) => CommonUtil.stringToEnum(ProgressEnum, progress));
      orders = orders.filter(
        (o) => o.isFirstStagePaid() && progressArray.includes(o.progress),
      );
    }
    return orders.map((order) => order.forView());
  }

  async findAll(
    where: WhereOptions<OrderDto>,
    includeUser: boolean,
    includeTickets: boolean,
    includeTransaction: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<OrderDto[]> {
    return this.orderRepository.findAll(
      where,
      includeUser,
      includeTickets,
      includeTransaction,
      sort,
      transaction,
    );
  }

  async findOneById(
    orderId: number,
    includeFiles?: boolean,
  ): Promise<OrderDto> {
    const orderDto = await this.findOne({ id: orderId }, false, true, true);
    if (!orderDto) throw new NotfoundException(`Order not found: ${orderId}`);

    if (includeFiles) {
      orderDto.additionalAttachments = await this.uploadService.findAllByIds(
        orderDto.additionalAttachmentIds,
      );
    }
    return orderDto.forView();
  }

  async findOne(
    where: Partial<OrderDto>,
    includeUser: boolean,
    includeTickets: boolean,
    includeTransactions: boolean,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    return this.orderRepository.findOne(
      where,
      includeUser,
      includeTickets,
      includeTransactions,
      transaction,
    );
  }

  async create(
    orderDto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    return this.orderRepository.create(
      OrderBuilder.toCreate(orderDto),
      transaction,
    );
  }

  async update(
    id: number,
    orderDto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    return this.orderRepository.update(id, orderDto, transaction);
  }

  // TODO: 同時要刪除所屬罰單?
  async remove(id: number, transaction?: Transaction): Promise<number> {
    return this.orderRepository.remove(id, transaction);
  }

  async removeUnusedOrder(
    originalOrderId: number,
    newOrderId: number,
    transaction: Transaction,
  ): Promise<number> {
    try {
      if (originalOrderId === newOrderId) return 0;

      const isOrderEmpty = await this.isOrderEmpty(
        originalOrderId,
        transaction,
      );
      return isOrderEmpty ? this.remove(originalOrderId, transaction) : 0;
    } catch (e) {
      throw new TicketException(`Remove unused order failed: ${e.message}`);
    }
  }

  private async isOrderEmpty(
    orderId: number,
    transaction?: Transaction,
  ): Promise<boolean> {
    if (!orderId) return true;
    const orderDto = await this.findOne(
      { id: orderId },
      false,
      true,
      false,
      transaction,
    );
    const ticketDtos = orderDto.tickets.flat();
    return !CommonUtil.isArray(ticketDtos);
  }

  async findAllForStatistic(
    startDate: Date,
    endDate: Date,
  ): Promise<TrackEventDto[]> {
    return this.orderRepository.findAllForStatistic(startDate, endDate);
  }
}
