import { IsEnum, IsString } from 'class-validator';
import { PaymentProviderEnum } from './payment.enum';

export class CancelPaymentReq {
  @IsString()
  id: string;
  @IsEnum(PaymentProviderEnum)
  paymentProvider: PaymentProviderEnum;

  constructor(data: Partial<CancelPaymentReq>) {
    Object.assign(this, data);
  }
}
