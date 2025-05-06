import { SendMailTemplateReq } from '../../third-party/mail/dto/send-mail-template.req';
import { MailLogDto } from './dto/mail-log.dto';
import { CommonUtil } from '../../common/util';
import { MailLogCategory, MailLogStatus } from './dto/mail-log.enum';

export class MailLogBuilder {
  static buildMailLogDto(
    req: SendMailTemplateReq,
    from: string,
    category: MailLogCategory,
    status: MailLogStatus,
  ): MailLogDto {
    return new MailLogDto({
      from,
      to: CommonUtil.findFirst(req.to),
      cc: req.cc,
      bcc: req.bcc,
      subject: req.subject,
      template: req.template,
      category,
      status,
    });
  }
}
