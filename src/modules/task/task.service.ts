import { Injectable } from '@nestjs/common';
import { TicketAppealService } from '../ticket/shared/ticket-appeal.service';
import { OrderService } from '../ticket/service/order.service';
import { PaymentStatusEnum } from '../../third-party/payment/dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly ticketAppealService: TicketAppealService,
    private readonly orderService: OrderService,
  ) {}

  // FIXME: (後續若不需要可刪除) 每日執行，確保一定有辨識資料
  async checkAndRecognize() {
    let orders = await this.orderService.findAll(
      { paymentStatus: PaymentStatusEnum.SUCCESSFUL },
      false,
      false,
      false,
    );
    orders = orders.filter((orderDto) => orderDto.isActive());
    for (const { id } of orders) {
      await this.ticketAppealService.checkAndUpdateOrderRecognized(id);
    }
    // const tickets = await this.ticketService.findAll(null, true, false, false);
    // for (const { id, orderDto } of tickets) {
    //   if (!orderDto) continue;
    //   if (orderDto.progress === ProgressEnum.PROCESSING) {
    //     await this.ticketAppealService.recognizeTicket(true, id, null);
    //   }
    // }
    // await this.reRecognize()
  }
}
