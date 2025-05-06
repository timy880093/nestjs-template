import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from 'fs/promises';
import { MailerService } from '@nestjs-modules/mailer';
import { chunk } from 'lodash';
import { SendHtmlRequestDto } from './dto/send-html.request.dto';
import { SendMailTemplateReq } from './dto/send-mail-template.req';
import { MailReqDto } from './dto/mail.req.dto';
import { MailResDto } from './dto/mail-res.dto';
import { SendErrorDto } from './dto/send-error.dto';
import mailConfig from './mail.config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MailException } from '@app/common/exception/mail.exception';
import { ValidatorUtil } from '@app/common/util';
import MailComposer from 'nodemailer/lib/mail-composer';

@Injectable()
export class MailService implements OnModuleInit {
  constructor(
    @InjectPinoLogger(MailService.name) private readonly logger: PinoLogger,
    private readonly mailerService: MailerService,
  ) {}

  private templates = [];

  async onModuleInit(): Promise<void> {
    this.logger.debug(
      { mailConfig: mailConfig() },
      'Init MailService mailConfig(): ',
    );
    this.templates = await this.loadTemplates(mailConfig().templateDir);
  }

  private async loadTemplates(path: string): Promise<string[]> {
    const files = await fs.readdir(path);
    const result = files
      .filter((file) => file.endsWith('.hbs'))
      .map((file) => file.replace('.hbs', ''));
    this.logger.debug({ path, result }, 'loadTemplates: ');
    return result;
  }

  async sendTemplate(dto: SendMailTemplateReq): Promise<MailResDto> {
    await ValidatorUtil.validate(dto);
    if (!this.templates.includes(dto.template))
      throw new MailException('Template not found');
    return this.sendRequest(dto);
  }

  async sendHtml(dto: SendHtmlRequestDto): Promise<MailResDto> {
    return this.sendRequest(dto);
  }

  async sendRequest(dto: MailReqDto): Promise<MailResDto> {
    const { context, attachments, ...dtoWithoutContext } = dto;
    this.logger.info({ dtoWithoutContext }, 'sendRequest: ');
    const toArray = dto.toArray();
    const errors: SendErrorDto[] = [];
    const batchSize = 20;
    let currentBatch = 0;

    const batchChunk = chunk(toArray, batchSize);
    for (const batch of batchChunk) {
      currentBatch++;
      const tasks = batch.map(async (to) => {
        try {
          // mailComposer 不能刪除，否則會導致 bcc 失效
          const mailComposer = new MailComposer(dto.buildOptions());
          const result = await this.mailerService.sendMail(dto.buildOptions());
          // this.logger.debug({ dto: dto.buildOptions() }, 'sendMail result: ');
          if (!result) throw new MailException('sendMail failed');
        } catch (e) {
          this.logger.warn({ message: e.message }, 'sendMail error: ');
          errors.push(new SendErrorDto({ to, message: e.message }));
        }
        return true;
      });
      const batchCompleted = await Promise.all(tasks);
      this.logger.debug(
        `sendMail progress: ${currentBatch}/${batchChunk.length}`,
        batchCompleted,
      );
    }
    const result = MailResDto.build(toArray.length, errors);
    this.logger.info({ result }, 'sendMail response: ');
    return result;
  }
}
