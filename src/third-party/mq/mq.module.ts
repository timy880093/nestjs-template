import { Module } from '@nestjs/common';
import { MqService } from './mq.service';
import { BullModule } from '@nestjs/bullmq';
import redisConfig from '../../config/redis.config';
import { MqController } from './mq.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: redisConfig().host,
          port: redisConfig().port,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'admin',
    }),
  ],
  providers: [MqService],
  controllers: [MqController],
  exports: [MqService],
})
export class MqModule {}
