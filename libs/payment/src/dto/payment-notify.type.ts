import { NewebpayNotifyReq } from './newebpay/newebpay-notify.req';
import { AfteeNotifyReq } from './aftee/aftee-notify.req';
import { NewebpayReq } from './newebpay/newebpay.req';
import { AfteePreRegisterRes } from './aftee/aftee-pre-register.res';
import { AfteeReturnReq } from './aftee/aftee-return.req';

export type PaymentNotifyReq = NewebpayNotifyReq | AfteeNotifyReq;
export type PaymentReturnReq = NewebpayNotifyReq | AfteeReturnReq;
export type FirstPaymentReq = NewebpayReq | AfteePreRegisterRes;
