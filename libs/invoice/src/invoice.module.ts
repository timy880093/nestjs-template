import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { EzpayProvider } from './ezpay.provider';

@Module({
  providers: [InvoiceService, EzpayProvider],
  exports: [InvoiceService],
})
export class InvoiceModule {}
