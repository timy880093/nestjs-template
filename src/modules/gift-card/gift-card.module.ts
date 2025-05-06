import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { InvoiceModule } from 'src/third-party/invoice/invoice.module';
import { PaymentModule } from 'src/third-party/payment/payment.module';
import { ItemModule } from '../item/item.module';
import { NewTransactionModule } from '../new-transaction/new-transaction.module';
import { UsersModule } from '../users/users.module';
import { GiftCardOrderDetailModel } from './entity/gift-card-order-detail.model';
import { GiftCardOrderModel } from './entity/gift-card-order.model';
import { GiftCardModel } from './entity/gift-card.model';
import { GiftCardController } from './gift-card.controller';
import { GiftCardRepository } from './gift-card.repository';
import { GiftCardService } from './gift-card.service';
import { MailLogModule } from '../mail-log/mail-log.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      GiftCardModel,
      GiftCardOrderModel,
      GiftCardOrderDetailModel,
    ]),
    MailLogModule,
    PaymentModule,
    InvoiceModule,
    UsersModule,
    NewTransactionModule,
    ItemModule,
  ],
  providers: [GiftCardService, GiftCardRepository],
  exports: [SequelizeModule, GiftCardService],
  controllers: [GiftCardController],
})
export class GiftCardModule {}
