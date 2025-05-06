import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { MailLogCategory, MailLogStatus } from './mail-log.enum';

export class MailLogDto {
  id: number;

  @IsEnum(MailLogStatus)
  status: MailLogStatus;

  @IsOptional()
  @IsEnum(MailLogCategory)
  category: MailLogCategory;

  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  cc: string[];

  @IsOptional()
  @IsString()
  bcc: string[];

  @IsString()
  subject: string;

  @ValidateIf((o) => !o.html)
  @IsString()
  template: string;

  @ValidateIf((o) => !o.template)
  @IsString()
  html: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(partial: Partial<MailLogDto>) {
    Object.assign(this, partial);
  }

  toView(): MailLogDto {
    delete this.html;
    return this;
  }
}
