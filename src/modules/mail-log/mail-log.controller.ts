import { Body, Controller, Post } from '@nestjs/common';
import { MailLogService } from './mail-log.service';
import { MailLogDto } from './dto/mail-log.dto';
import { SendMailTemplateReq } from '../../third-party/mail/dto/send-mail-template.req';

@Controller('mail-log')
export class MailLogController {
  constructor(private readonly mailLogService: MailLogService) {}

  @Post('template')
  async sendTemplateMail(
    @Body() req: SendMailTemplateReq,
  ): Promise<MailLogDto> {
    return this.mailLogService.sendTemplate(req, null);
  }
}
