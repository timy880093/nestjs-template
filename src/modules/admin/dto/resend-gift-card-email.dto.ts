import { IsEmail, IsString } from 'class-validator';

export class ResendGiftCardEmailReq {
  @IsEmail()
  email: string; // 不一定要和原訂單的 email 一樣，可修改
  @IsString()
  tradeNo: string; // 必須和原訂單的 tradeNo 一樣
}
