import { Module } from '@nestjs/common';
import { MqConsumerProcessor } from './mq-consumer.processor';
import { MqModule } from '../../third-party/mq/mq.module';
import { TicketModule } from '../ticket/ticket.module';
import { MqConsumerService } from './mq-consumer.service';

@Module({
  imports: [MqModule, TicketModule],
  providers: [MqConsumerProcessor, MqConsumerService],
})
export class MqConsumerModule {}
