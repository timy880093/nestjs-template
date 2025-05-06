import { Injectable } from '@nestjs/common';
import { TicketAppealService } from '../ticket/shared/ticket-appeal.service';
import { MqService } from '../../third-party/mq/mq.service';

@Injectable()
export class MqConsumerService {
  constructor(
    private readonly ticketAppealService: TicketAppealService,
    private readonly mqService: MqService,
  ) {}

  async checkAndUpdateOrderRecognized(orderId: number) {
    return this.ticketAppealService.checkAndUpdateOrderRecognized(orderId);
  }
}
