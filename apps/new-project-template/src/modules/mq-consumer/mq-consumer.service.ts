import { Injectable } from '@nestjs/common';
import { MqService } from '@app/mq/mq.service';

@Injectable()
export class MqConsumerService {
  constructor(private readonly mqService: MqService) {}

  async checkAndUpdateOrderRecognized(orderId: number) {}
}
