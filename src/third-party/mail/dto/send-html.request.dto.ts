import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MailReqDto } from './mail.req.dto';
import { ISendMailOptions } from '@nestjs-modules/mailer';

export class SendHtmlRequestDto extends MailReqDto {
  @ApiProperty({ description: '模板' })
  @IsString()
  readonly html?: string;

  buildOptions(): ISendMailOptions {
    return {
      html: this.html,
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
    };
  }
}
