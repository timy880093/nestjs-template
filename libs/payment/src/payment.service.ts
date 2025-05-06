import { Injectable } from '@nestjs/common';
import { PaymentProviderEnum } from './dto/payment.enum';
import { NewebpayAdapter } from './adapter/newebpay.adapter';
import { PaymentRes } from './dto/payment.res';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PaymentReq } from './dto/payment.req';
import { AfteeAdapter } from './adapter/aftee.adapter';
import { PaymentLinkRes } from './dto/payment-link.res';
import { NewebpayNotifyReq } from './dto/newebpay/newebpay-notify.req';
import { AfteeNotifyReq } from './dto/aftee/aftee-notify.req';
import {
  FirstPaymentReq,
  PaymentNotifyReq,
  PaymentReturnReq,
} from './dto/payment-notify.type';
import { UpdatePaymentReq } from './dto/update-payment.req';
import { CancelPaymentReq } from './dto/cancel-payment.req';
import { CancelPaymentRes } from './dto/cancel-payment.res';
import { AfteeBuilder } from './util/aftee-builder';
import { NewebpayBuilder } from './util/newebpay-builder';

@Injectable()
export class PaymentService {
  constructor(
    private readonly aftee: AfteeAdapter,
    private readonly newebpay: NewebpayAdapter,
    @InjectPinoLogger(PaymentService.name)
    private readonly logger: PinoLogger,
  ) {
    // this.ezpay = appConfig().env === 'production' ? this.ezpay : null;
  }

  async paymentLink(
    paymentProvider: PaymentProviderEnum,
    dto: PaymentReq,
  ): Promise<PaymentLinkRes> {
    switch (paymentProvider) {
      case PaymentProviderEnum.AFTEE:
        return this.aftee.paymentLink(dto);
      default:
        return this.newebpay.paymentLink(dto);
    }
  }

  async paymentData(
    paymentProvider: PaymentProviderEnum,
    dto: PaymentReq,
  ): Promise<FirstPaymentReq> {
    switch (paymentProvider) {
      case PaymentProviderEnum.AFTEE:
        return this.aftee.paymentData(dto);
      default:
        return this.newebpay.paymentData(dto);
    }
  }

  parsePaymentNotifyResult(result: PaymentNotifyReq): PaymentRes {
    if (NewebpayBuilder.isNewebpayResult(result)) {
      this.logger.debug({ result }, 'parsePaymentResult newebpay: ');
      return this.newebpay.parsePaymentNotifyResult(
        result as NewebpayNotifyReq,
      );
    }
    if (AfteeBuilder.isAfteeResult(result)) {
      this.logger.debug({ result }, 'parsePaymentResult aftee: ');
      return this.aftee.parsePaymentNotifyResult(result as AfteeNotifyReq);
    }
    return;
  }

  parsePaymentReturnResult(result: PaymentReturnReq): PaymentRes {
    if (NewebpayBuilder.isNewebpayResult(result)) {
      this.logger.debug({ result }, 'parsePaymentResult newebpay: ');
      return this.newebpay.parsePaymentReturnResult(
        result as NewebpayNotifyReq,
      );
    }
    if (AfteeBuilder.isAfteeResult(result)) {
      this.logger.debug({ result }, 'parsePaymentResult aftee: ');
      return this.aftee.parsePaymentReturnResult(result as AfteeNotifyReq);
    }
    return;
  }

  async updatePayment(
    paymentProvider: PaymentProviderEnum,
    dto: UpdatePaymentReq,
  ): Promise<PaymentRes> {
    switch (paymentProvider) {
      case PaymentProviderEnum.AFTEE:
        return this.aftee.update(dto);
      default:
        return this.newebpay.update(dto);
    }
  }

  async cancelPayment(req: CancelPaymentReq): Promise<CancelPaymentRes> {
    switch (req.paymentProvider) {
      case PaymentProviderEnum.AFTEE:
        return this.aftee.cancel(req);
      default:
        return this.newebpay.cancel(req);
    }
  }
}
