import { Module } from '@nestjs/common';
import { StatisticModule } from '../statistic/statistic.module';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './admin.service';
import { TicketModule } from '../ticket/ticket.module';
import { MqModule } from '../../third-party/mq/mq.module';
import { AdminOrderController } from './controller/admin-order.controller';
import { AdminTicketSubmissionController } from './controller/admin-ticket-submission.controller';
import { AdminUserController } from './controller/admin-user.controller';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from '../../common/guard/admin.guard';
import { AdminTransactionController } from './controller/admin-transaction.controller';
import { AdminTicketController } from './controller/admin-ticket.controller';
import { MailLogModule } from '../mail-log/mail-log.module';
import { GiftCardModule } from '../gift-card/gift-card.module';
import { AdminGiftCardController } from './controller/admin-gift_card.controller';

@Module({
  imports: [
    TicketModule,
    MqModule,
    MailLogModule,
    UsersModule,
    GiftCardModule,
    StatisticModule,
  ],
  controllers: [
    AdminController,
    AdminOrderController,
    AdminTicketController,
    AdminTicketSubmissionController,
    AdminUserController,
    AdminTransactionController,
    AdminGiftCardController,
  ],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
