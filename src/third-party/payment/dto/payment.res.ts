import { PaymentMethodEnum, PaymentStatusEnum } from './payment.enum';

export class PaymentRes {
  status: PaymentStatusEnum;
  paymentMethod: PaymentMethodEnum;
  payAt: Date;
  tradeNo: string;
  providerTradeNo: string;
  token: string;
  error?: string;

  constructor(dto: Partial<PaymentRes>) {
    if (!dto.payAt) dto.payAt = new Date();
    Object.assign(this, dto);
  }

  isSuccess(): boolean {
    return this.status === PaymentStatusEnum.SUCCESSFUL;
  }
}
