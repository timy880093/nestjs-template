import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { ErrorUtil } from '@app/common/util/error.util';
import { IsPhoneOrPhoneArray } from '@app/common/validator/phone.constraints';

export class PaymentReq {
  @IsNumber({}, { message: ErrorUtil.invalidNumber('price') })
  totalAmount: number;
  @IsString({ message: ErrorUtil.invalid('orderNo', 'must be a string') })
  tradeNo: string;
  @IsString({ message: ErrorUtil.invalid('username', 'must be a string') })
  username: string;
  @IsString({ message: ErrorUtil.invalid('userUuid', 'must be a string') })
  userUuid: string;
  @IsPhoneOrPhoneArray({ message: ErrorUtil.invalidPhone('phone') })
  phone: string;
  @IsEmail({}, { message: ErrorUtil.invalidEmail('email') })
  email: string;
  @IsString({ message: ErrorUtil.invalid('product', 'must be a string') })
  product: string;
  @IsOptional()
  @IsNumber({}, { message: ErrorUtil.invalidNumber('totalAmountPaid') })
  totalAmountPaid: number; // 歷史總金額(成功)
  @IsOptional()
  @IsNumber({}, { message: ErrorUtil.invalidNumber('timesPaid') })
  timesPaid: number; // 歷史總次數(成功)
  @IsOptional()
  @IsString({ message: ErrorUtil.invalid('notifyURL', 'must be a string') })
  notifyURL?: string; // 付款後通知結果的網址
  @IsOptional()
  @IsString({ message: ErrorUtil.invalid('returnURL', 'must be a string') })
  returnURL?: string; // 付款後返回的網址

  constructor(data: Partial<PaymentReq>) {
    Object.assign(this, data);
  }
}
