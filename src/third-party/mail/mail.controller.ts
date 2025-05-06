import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendHtmlRequestDto } from './dto/send-html.request.dto';
import { SendMailTemplateReq } from './dto/send-mail-template.req';
import { MailResDto } from './dto/mail-res.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  // send mail
  @Post('template')
  sendTemplate(@Body() dto: SendMailTemplateReq): Promise<MailResDto> {
    return this.mailService.sendTemplate(dto);
  }

  @Post('html')
  sendHtml(@Body() dto: SendHtmlRequestDto) {
    return this.mailService.sendHtml(dto);
  }
}
