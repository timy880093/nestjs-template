import { IsEmail, IsNumber, IsString } from 'class-validator';
import { ErrorUtil } from '../../../common/util/error.util';

export class UpdatePaymentReq {
  @IsString()
  token: string;
  @IsString()
  providerTradeNo: string;
  @IsNumber({}, { message: ErrorUtil.invalidNumber('price') })
  totalAmount: number;
  @IsString({ message: ErrorUtil.invalid('orderNo', 'must be a string') })
  tradeNo: string;
  @IsString()
  username: string;
  @IsString()
  userUuid: string;
  @IsString()
  phone: string;
  @IsEmail({}, { message: ErrorUtil.invalidEmail('email') })
  email: string;
  @IsString({ message: ErrorUtil.invalid('product', 'must be a string') })
  product: string;
  totalAmountPaid: number; // 歷史總金額(成功)
  timesPaid: number; // 歷史總次數(成功)

  parseToken() {
    if (!this.token) return;
    return this.token.startsWith('tk_') ? this.token : `tk_${this.token}`;
  }

  constructor(data: Partial<UpdatePaymentReq>) {
    Object.assign(this, data);
  }
}
