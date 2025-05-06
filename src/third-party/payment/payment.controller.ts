import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CancelPaymentReq,
  CancelPaymentRes,
  PaymentProviderEnum,
  PaymentReq,
  PaymentRes,
  UpdatePaymentReq,
} from './dto';

import { PaymentService } from './payment.service';

// @Public()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // FIXME 測試結束要關閉
  @Get(':provider')
  async createPaymentAndRedirect(
    @Param('provider') provider: PaymentProviderEnum,
    @Query('tradeNo') tradeNo: string,
    @Query('totalAmount') totalAmount: number,
    @Query('product') product: string,
    @Query('username') username: string,
    @Query('userUuid') userUuid: string,
    @Query('phone') phone: string,
    @Query('email') email: string,
    @Query('notifyURL') notifyURL: string,
    @Query('returnURL') returnURL: string,
    @Res() res: Response,
  ): Promise<void> {
    const paymentReqDto = new PaymentReq({
      tradeNo,
      totalAmount,
      product,
      username,
      userUuid,
      phone,
      email,
      notifyURL,
      returnURL,
    });
    const { html, url } = await this.paymentService.paymentLink(
      provider,
      paymentReqDto,
    );
    if (html) {
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else if (url) {
      res.redirect(HttpStatus.FOUND, url);
    } else {
      throw new HttpException(
        'Failed to create payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':provider')
  async updatePayment(
    @Param('provider') provider: PaymentProviderEnum,
    @Body() body: UpdatePaymentReq,
  ): Promise<PaymentRes> {
    return this.paymentService.updatePayment(provider, body);
  }

  @Patch(':paymentProvider/:id/cancel')
  async cancelPayment(
    @Param() req: CancelPaymentReq,
  ): Promise<CancelPaymentRes> {
    return this.paymentService.cancelPayment(req);
  }
}
