import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/common/decorator/public.decorator';
import { NewebpayNotifyReq } from 'src/third-party/payment/dto/newebpay/newebpay-notify.req';
import { GiftCardService } from './gift-card.service';
import { GiftCardOrderDto } from './dto/gift-card-order.dto';
import { Response } from 'express';
import { NewebpayReq } from 'src/third-party/payment/dto/newebpay/newebpay.req';
import { GiftCardItemDto } from './dto/gift-card-item.dto';

@Controller('gift-card')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Public()
  @Post(['payment'])
  @ApiResponse({ status: 200, description: 'create gift card order' })
  async createGiftCardOrder(
    @Body() body: GiftCardOrderDto,
  ): Promise<NewebpayReq> {
    const paymentData = (await this.giftCardService.payment(
      body,
    )) as unknown as NewebpayReq;
    // const html = this.giftCardService.genPaymentHtml(paymentData);
    // res.set('Content-Type', 'text/html');
    // res.send(html);
    return paymentData;
  }

  @Get(['payment/test'])
  async createGiftCardOrderTest(@Res() res: Response): Promise<void> {
    console.log('test:');

    const paymentData = (await this.giftCardService.payment({
      name: 'test',
      phone: 'test',
      email: 'oxox850502@gmail.com',
      itemId: 7,
    })) as unknown as NewebpayReq;
    const html = this.giftCardService.genPaymentHtml(paymentData);

    res.set('Content-Type', 'text/html');
    res.send(html);
  }

  @Public()
  @Get(['plan'])
  @ApiResponse({ status: 200, description: 'get gift card item' })
  async getGiftCardAllItem(): Promise<GiftCardItemDto[]> {
    const result = await this.giftCardService.getGiftCardAllItem();
    return result.map((r) => new GiftCardItemDto(r));
  }

  @Public()
  @Get(['plan/:itemId'])
  @ApiResponse({ status: 200, description: 'get single gift card item' })
  async getGiftCardItemById(
    @Param('itemId') itemId: number,
  ): Promise<GiftCardItemDto> {
    const result = await this.giftCardService.getGiftCardItemById(itemId);
    return new GiftCardItemDto(result);
  }

  @Public()
  @Post(['newebpay/notify'])
  @ApiOperation({ summary: 'Newebpay payment notify' })
  @ApiResponse({ status: 200, description: 'Return payment notify' })
  async newebpayPaymentNotify(@Body() body: NewebpayNotifyReq): Promise<void> {
    console.log('newebpayPaymentNotify start');
    // this.logger.debug({ body }, 'newebpayPaymentNotify: ');
    await this.giftCardService.paymentNotify(body);
  }

  @Public()
  @Post(['newebpay/return'])
  @ApiOperation({ summary: 'Newebpay payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async newebpayPaymentReturn(@Res() res: any, @Body() body: any) {
    const url = await this.giftCardService.getPaymentReturnUrl(body);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Get(['test/template'])
  async testTempalte(@Res() res: any) {
    const planAList = ['test1', 'test2', 'test3', 'test4', 'test5'];
    const planBList = [
      'test1',
      'test2',
      'test3',
      'test4',
      'test5',
      'test6',
      'test1',
      'test2',
      'test3',
    ];
    const email = 'timmy@suodata.com';
    const result = await this.giftCardService.sendGiftCardEmail(
      planBList,
      email,
      'test01',
      new Date(),
    );
    return;
    // res.set({
    //   'Content-Type': 'application/pdf',
    //   'Content-Disposition': 'attachment; filename="example.pdf"',
    // });

    // res.send(pdfBuffer);
  }

  // private getReadableStream(buffer: Buffer): Readable {
  //   const stream = new Readable();

  //   stream.push(buffer);
  //   stream.push(null);

  //   return stream;
  // }
}
