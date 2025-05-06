import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { IsEmailOrEmailArray } from '@app/common/validator/email.constraints';
import { Attachment } from 'nodemailer/lib/mailer';

export abstract class MailReqDto {
  @ApiProperty({ description: '主旨' })
  @IsString()
  readonly subject: string;
  @ApiProperty({ description: '參數 obj' })
  @IsOptional()
  readonly context?: any;
  @ApiProperty({ description: '標籤' })
  @IsOptional()
  @IsString()
  readonly tag?: string;
  @ApiProperty({ description: '收件者' })
  @IsEmailOrEmailArray()
  readonly to: string | string[];
  readonly cc?: string[];
  readonly bcc?: string[];
  readonly attachments?: Attachment[];

  toArray(): string[] {
    return Array.isArray(this.to) ? this.to : [this.to];
  }

  abstract buildOptions(): ISendMailOptions;
}
