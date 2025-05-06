import { IsEmail, IsNumber, IsOptional } from 'class-validator';

export class SendProgressMailReq {
  @IsNumber()
  id: number;
  @IsOptional()
  @IsEmail()
  email?: string;
}
