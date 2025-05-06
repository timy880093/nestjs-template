import { Module } from '@nestjs/common';
import { NewebpayAdapter } from './adapter/newebpay.adapter';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AfteeAdapter } from './adapter/aftee.adapter';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, NewebpayAdapter, AfteeAdapter],
  exports: [PaymentService],
})
export class PaymentModule {}
