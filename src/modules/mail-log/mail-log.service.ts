import { Injectable } from '@nestjs/common';
import { MailLogRepository } from './mail-log.repository';
import { MailLogDto } from './dto/mail-log.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MailService } from '../../third-party/mail/mail.service';
import { SendMailTemplateReq } from '../../third-party/mail/dto/send-mail-template.req';
import { MailLogBuilder } from './mail-log.builder';
import mailConfig from '../../third-party/mail/mail.config';
import { MailLogCategory, MailLogStatus } from './dto/mail-log.enum';
import { TicketException } from '../../common/exception/ticket.exception';
import appConfig from '../../config/app.config';

@Injectable()
export class MailLogService {
  private readonly from: string;
  private readonly bccReceiver: string[];

  constructor(
    @InjectPinoLogger(MailLogService.name) private readonly logger: PinoLogger,
    private readonly mailLogRepository: MailLogRepository,
    private readonly mailService: MailService,
  ) {
    this.from = mailConfig().from;
    this.bccReceiver = appConfig().bccReceiver;
  }

  async sendTemplate(
    req: SendMailTemplateReq,
    category: MailLogCategory,
  ): Promise<MailLogDto> {
    try {
      req = new SendMailTemplateReq({
        ...req,
        bcc: this.bccReceiver,
      });
      const mailResDto = await this.mailService.sendTemplate(req);
      const mailLogDto = MailLogBuilder.buildMailLogDto(
        req,
        this.from,
        category,
        mailResDto.errorCount > 0
          ? MailLogStatus.FAILED
          : MailLogStatus.SUCCESSFUL,
      );
      let result = mailLogDto;
      try {
        result = await this.create(mailLogDto);
      } catch (e) {
        this.logger.warn(
          { mailLogDto, error: e.message },
          'Failed to save mail log: ',
        );
      }
      return result;
    } catch (e) {
      throw new TicketException('Failed to send email: ' + e.message);
    }
  }

  async findOne(where: Partial<MailLogDto>): Promise<MailLogDto> {
    return this.mailLogRepository.findOne(where);
  }

  async findAll(where: Partial<MailLogDto>): Promise<MailLogDto[]> {
    return this.mailLogRepository.findAll(where);
  }

  async create(data: Partial<MailLogDto>): Promise<MailLogDto> {
    return this.mailLogRepository.create(data);
  }

  async update(
    data: Partial<MailLogDto>,
    where: Partial<MailLogDto>,
  ): Promise<MailLogDto> {
    return this.mailLogRepository.update(data, where);
  }
}
