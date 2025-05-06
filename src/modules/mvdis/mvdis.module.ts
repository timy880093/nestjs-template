import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StatisticModule } from '../statistic/statistic.module';
import { MvdisOwnerModel } from './entity/mvdis-owner.model';
import { MvdisTicketModel } from './entity/mvdis-ticket.model';
import { MvdisController } from './mvdis.controller';
import { MvdisRepository } from './mvdis.repository';
import { MvdisService } from './mvdis.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MvdisOwnerModel, MvdisTicketModel]),
    StatisticModule,
  ],
  providers: [MvdisRepository, MvdisService],
  exports: [SequelizeModule, MvdisService],
  controllers: [MvdisController],
})
export class MvdisModule {}
