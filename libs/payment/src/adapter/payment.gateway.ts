import { PaymentReq } from '../dto/payment.req';
import { PaymentLinkRes } from '../dto/payment-link.res';
import { PaymentRes } from '../dto/payment.res';
import { UpdatePaymentReq } from '../dto/update-payment.req';
import { CancelPaymentReq } from '../dto/cancel-payment.req';
import { CancelPaymentRes } from '../dto/cancel-payment.res';
import { PaymentNotifyReq, PaymentReturnReq } from '../dto/payment-notify.type';

export interface PaymentGateway {
  paymentData(paymentReqDto: PaymentReq): Promise<any>;

  paymentLink(paymentReqDto: PaymentReq): Promise<PaymentLinkRes>;

  parsePaymentNotifyResult(result: PaymentNotifyReq): PaymentRes;

  parsePaymentReturnResult(result: PaymentReturnReq): PaymentRes;

  update(req: UpdatePaymentReq): Promise<PaymentRes>;

  cancel(req: CancelPaymentReq): Promise<CancelPaymentRes>;

  // query(): void;
}
