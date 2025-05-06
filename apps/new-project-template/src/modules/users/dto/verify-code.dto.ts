import { IsEmail, IsString } from 'class-validator';
import { IsPhoneOrPhoneArray } from '@app/common/validator/phone.constraints';

export class SendPhoneCodeReq {
  @IsPhoneOrPhoneArray()
  phone: string;
}

export class CheckPhoneCodeReq {
  @IsPhoneOrPhoneArray()
  phone: string;

  @IsString()
  code: string;
}

export class SendEmailCodeReq {
  @IsEmail()
  email: string;
}

export class CheckEmailCodeReq {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
