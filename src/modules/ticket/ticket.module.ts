import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InvoiceModule } from '../../third-party/invoice/invoice.module';
import { MqModule } from '../../third-party/mq/mq.module';
import { PaymentModule } from '../../third-party/payment/payment.module';
import { RedisModule } from '../../third-party/redis/redis.module';
import { ItemModule } from '../item/item.module';
import { RecognitionModule } from '../recognition/recognition.module';
import { UploadModule } from '../upload/upload.module';
import { UsersModule } from '../users/users.module';
import { OrderPaymentController } from './controller/order-payment.controller';
import { OrderController } from './controller/order.controller';
import { PenaltyController } from './controller/penalty.controller';
import { TicketController } from './controller/ticket.controller';
import { CouponModel } from './entity/coupon.model';
import { OrderModel } from './entity/order.model';
import { PenaltyModel } from './entity/penalty.model';
import { RecognizeLogModel } from './entity/recognize-log.model';
import { TicketSubmissionModel } from './entity/ticket-submission.model';
import { TicketModel } from './entity/ticket.model';
import { TransactionModel } from './entity/transaction.model';
import { CouponRepository } from './repository/coupon.repository';
import { OrderRepository } from './repository/order.repository';
import { PenaltyRepository } from './repository/penalty.repository';
import { RecognizeLogRepository } from './repository/recognize-log.repository';
import { TicketSubmissionRepository } from './repository/ticket-submission.repository';
import { TicketRepository } from './repository/ticket.repository';
import { TransactionRepository } from './repository/transaction.repository';
import { CouponService } from './service/coupon.service';
import { OrderService } from './service/order.service';
import { PenaltyService } from './service/penalty.service';
import { RecognizeLogService } from './service/recognize-log.service';
import { TicketSharedService } from './service/ticket-shared.service';
import { TicketSubmissionService } from './service/ticket-submission.service';
import { TicketService } from './service/ticket.service';
import { TransactionService } from './service/transaction.service';
import { TicketAppealService } from './shared/ticket-appeal.service';
import { TicketImportService } from './shared/ticket-import.service';
import { GiftCardModule } from '../gift-card/gift-card.module';
import { MailLogModule } from '../mail-log/mail-log.module';
import { MvdisModule } from '../mvdis/mvdis.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TicketModel,
      TicketSubmissionModel,
      OrderModel,
      TransactionModel,
      CouponModel,
      RecognizeLogModel,
      PenaltyModel,
    ]),
    UsersModule,
    RedisModule,
    MqModule,
    MailLogModule,
    UploadModule,
    PaymentModule,
    InvoiceModule,
    RecognitionModule,
    ItemModule,
    GiftCardModule,
    MvdisModule,
  ],
  providers: [
    TicketAppealService,
    TicketImportService,
    TicketSharedService,
    TicketService,
    TicketRepository,
    TicketSubmissionService,
    TicketSubmissionRepository,
    OrderService,
    OrderRepository,
    TransactionService,
    TransactionRepository,
    CouponService,
    CouponRepository,
    RecognizeLogService,
    RecognizeLogRepository,
    PenaltyService,
    PenaltyRepository,
  ],
  exports: [
    SequelizeModule,
    TicketAppealService,
    TicketImportService,
    OrderService,
    TicketService,
    TicketSubmissionService,
    TransactionService,
  ],
  controllers: [
    TicketController,
    OrderController,
    OrderPaymentController,
    PenaltyController,
  ],
})
export class TicketModule {}
