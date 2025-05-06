import { IsEmail, IsNumber, IsOptional } from 'class-validator';

export class AdminSecondPaymentReq {
  @IsOptional()
  @IsNumber()
  successFee: number; // 成效金
  @IsEmail()
  email: string;
}
