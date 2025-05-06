import { Module } from '@nestjs/common';
import { NoAuthService } from './no-auth.service';
import { NoAuthLineController } from './no-auth-line.controller';
import { TicketModule } from '../ticket/ticket.module';
import { UsersModule } from '../users/users.module';
import { NoAuthPaymentController } from './no-auth-payment.controller';
import { UploadModule } from '../upload/upload.module';
import { NoAuthController } from './no-auth.controller';
import { StatisticModule } from '../statistic/statistic.module';

@Module({
  imports: [TicketModule, UsersModule, UploadModule, StatisticModule],
  providers: [NoAuthService],
  controllers: [
    NoAuthPaymentController,
    NoAuthLineController,
    NoAuthController,
  ],
})
export class NoAuthModule {}
