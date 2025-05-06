import { PaymentProviderEnum } from '../../../third-party/payment/dto/payment.enum';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreatePaymentReqDto {
  @IsOptional()
  @IsEnum(PaymentProviderEnum)
  paymentProvider: PaymentProviderEnum;
  @IsOptional()
  @IsString()
  couponCode?: string;
  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;
  @IsOptional()
  @IsString()
  phone?: string;

  constructor(data: Partial<CreatePaymentReqDto>) {
    Object.assign(this, data);
  }
}
