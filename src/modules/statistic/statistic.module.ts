import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RedisModule } from '../../third-party/redis/redis.module';
import { EventLogModel, Super8InfoModel } from './entity';
import {
  EventLogService,
  StatisticService,
  Super8InfoService,
} from './service';
import { EventLogRepository, Super8InfoRepository } from './repository';
import { StatisticController, StatisticPublicController } from './controller';

@Module({
  imports: [
    SequelizeModule.forFeature([EventLogModel, Super8InfoModel]),
    RedisModule,
  ],
  providers: [
    StatisticService,
    EventLogService,
    Super8InfoService,
    EventLogRepository,
    Super8InfoRepository,
  ],
  controllers: [StatisticController, StatisticPublicController],
  exports: [StatisticService],
})
export class StatisticModule {}
