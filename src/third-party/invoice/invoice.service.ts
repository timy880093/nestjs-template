import { Injectable } from '@nestjs/common';
import { EzpayReq } from './dto/ezpay.req';
import { InvoiceRes } from './dto/invoice.res';
import { EzpayProvider } from './ezpay.provider';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectPinoLogger() private readonly logger: PinoLogger,
    private readonly ezpay: EzpayProvider,
  ) {}

  async issue(ezpayReqDto: EzpayReq): Promise<InvoiceRes> {
    this.logger.debug({ ezpayReqDto }, 'issueInvoice: ');
    if (!this.ezpay) return null;
    try {
      const issueResult = await this.ezpay.sendIssue(ezpayReqDto);
      this.logger.debug({ issueResult }, 'sendIssue result:');
      return this.ezpay.parseInvoiceResult(issueResult);
    } catch (e) {
      // this.logger.error({ e }, 'issueInvoice error:');
      return InvoiceRes.error(e.message);
    }
  }
}
