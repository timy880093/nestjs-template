import { Module } from '@nestjs/common';
import { MailLogService } from './mail-log.service';
import { MailModule } from '../../third-party/mail/mail.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { MailLogController } from './mail-log.controller';
import { MailLogRepository } from './mail-log.repository';
import { MailLogModel } from './dto/mail-log.model';

@Module({
  imports: [MailModule, SequelizeModule.forFeature([MailLogModel])],
  providers: [MailLogService, MailLogRepository],
  controllers: [MailLogController],
  exports: [MailLogService],
})
export class MailLogModule {}
