import { Module } from '@nestjs/common';
import { MqConsumerProcessor } from './mq-consumer.processor';
import { MqModule } from '@app/mq/mq.module';
import { MqConsumerService } from './mq-consumer.service';

@Module({
  imports: [MqModule],
  providers: [MqConsumerProcessor, MqConsumerService],
})
export class MqConsumerModule {}
