import { Injectable } from '@nestjs/common';
import { EzpayReq } from './dto/ezpay.req';
import qs from 'querystring';
import { PaymentException } from '@app/common/exception/payment.exception';
import paymentConfig from '@app/payment/payment.config';
import axios from 'axios';
import { InvoiceRes } from '@app/invoice/dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CryptoUtil, ValidatorUtil } from '../../common/src/util';

@Injectable()
export class EzpayProvider {
  private config = paymentConfig().ezpay;

  constructor(@InjectPinoLogger() private readonly logger?: PinoLogger) {}

  async sendIssue(req: EzpayReq): Promise<any> {
    await ValidatorUtil.validate(req);
    // get string
    const postDataStr = qs.stringify({ ...req });
    // get encrypted
    const { createCipheriv } = await import('node:crypto');
    const cipher = createCipheriv(
      'aes-256-cbc',
      this.config.hashKey,
      this.config.hashIV,
    );

    const encrypted =
      cipher.update(postDataStr, 'binary', 'hex') + cipher.final('hex');

    // get form
    const formData = new URLSearchParams({
      MerchantID_: this.config.merchantID,
      PostData_: encrypted,
    }).toString();

    // send
    const { data } = await axios.post(this.config.url, formData);
    return data;
  }

  async parseInvoiceResult(invoiceRes: any): Promise<InvoiceRes> {
    this.logger.debug({ invoiceRes }, 'parseInvoiceResult: ');
    try {
      if (!invoiceRes) {
        throw new PaymentException('empty invoiceRes');
      }

      const {
        Status: status,
        Message: message,
        Result: rawResult,
      } = invoiceRes;
      if (status !== 'SUCCESS') {
        return InvoiceRes.error(message);
      }
      const result = JSON.parse(rawResult);
      const {
        InvoiceNumber,
        InvoiceTransNo,
        MerchantID,
        MerchantOrderNo,
        RandomNum,
        TotalAmt,
        CheckCode,
        // CreateTime,
      } = result;
      const rawChecksum = [
        `HashIV=${this.config.hashIV}`,
        `InvoiceTransNo=${InvoiceTransNo}`,
        `MerchantID=${MerchantID}`,
        `MerchantOrderNo=${MerchantOrderNo}`,
        `RandomNum=${RandomNum}`,
        `TotalAmt=${TotalAmt}`,
        `HashKey=${this.config.hashKey}`,
      ].join('&');

      const { createHash } = await import('node:crypto');
      const ourCheckCode = CryptoUtil.generateSha256Hash(rawChecksum, true);
      if (ourCheckCode !== CheckCode) {
        throw new PaymentException('checkCode is not matched');
      }
      return InvoiceRes.success(InvoiceNumber, RandomNum, new Date());
    } catch (e) {
      e.message = `parseInvoiceResult error: ${e.message}`;
      throw e;
    }
  }
}
