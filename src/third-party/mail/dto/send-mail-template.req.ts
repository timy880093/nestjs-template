import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MailReqDto } from './mail.req.dto';
import { ISendMailOptions } from '@nestjs-modules/mailer';

export class SendMailTemplateReq extends MailReqDto {
  @ApiProperty({ description: '模板' })
  @IsString()
  readonly template?: string;

  constructor(data: Partial<SendMailTemplateReq>) {
    super();
    Object.assign(this, data);
  }

  buildOptions(): ISendMailOptions {
    return {
      template: this.template,
      subject: this.subject,
      context: this.context,
      to: this.to,
      cc: this.cc,
      bcc: this.bcc,
      ...(this.tag && {
        headers: {
          'x-mailgun-tag': this.tag,
        },
      }),
      attachments: this.attachments,
    };
  }
}
