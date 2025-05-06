import { Injectable } from '@nestjs/common';
import { EzpayReq } from '@app/invoice/dto/ezpay.req';
import { EzpayProvider } from '@app/invoice/ezpay.provider';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InvoiceRes } from '@app/invoice/dto';

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
