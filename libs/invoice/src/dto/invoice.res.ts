import { plainToInstance } from 'class-transformer';
import { PaymentStatusEnum } from '@app/payment/dto/payment.enum';

export class InvoiceRes {
  status: PaymentStatusEnum;
  invoiceNo: string;
  invoiceRandomNo: string;
  invoiceAt: Date;
  error?: string;

  constructor(dto: Partial<InvoiceRes>) {
    return plainToInstance(InvoiceRes, dto);
  }

  static success(
    invoiceNo: string,
    invoiceRandomNo: string,
    invoiceAt: Date,
  ): InvoiceRes {
    return new InvoiceRes({
      status: PaymentStatusEnum.SUCCESSFUL,
      invoiceNo,
      invoiceRandomNo,
      invoiceAt,
    });
  }

  static error(error: string): InvoiceRes {
    return new InvoiceRes({ status: PaymentStatusEnum.FAILED, error });
  }
}
