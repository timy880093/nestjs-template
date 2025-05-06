import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { NoAuthService } from './no-auth.service';
import { Public } from '../../common/decorator/public.decorator';
import { CreateSimpleTicketReq } from './dto/create-simple-ticket.req';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';
import { OrderDto } from '../ticket/dto/order.dto';
import { OrderFirstPriceDto } from '../ticket/dto/order-price.dto';
import { CouponDiscountDto } from '../ticket/dto/coupon-discount.dto';
import { CreatePaymentReqDto } from '../ticket/dto/create-payment.req.dto';
import { FirstPaymentReq } from '../../third-party/payment/dto/payment-notify.type';
import { UpdateSimpleTicketReq } from './dto/update-simple-ticket.req';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadS3Dto } from '../../third-party/s3-storage/upload-s3.dto';
import { Throttle } from '@nestjs/throttler';

@Public()
@Controller('no-auth/line')
export class NoAuthLineController {
  constructor(private readonly noAuthService: NoAuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @Post(':lineUid/file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @Param('lineUid') lineUid: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadS3Dto> {
    return this.noAuthService.uploadFile(lineUid, file);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @ApiOperation({ summary: '建立 user/罰單/訂單' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiBody({ type: CreateSimpleTicketReq })
  @Post(':lineUid/ticket')
  async createTicketsAndOrder(
    @Param('lineUid') lineUid: string,
    @Body() req: CreateSimpleTicketReq,
  ): Promise<OrderDto> {
    return this.noAuthService.createTicketsAndOrder(lineUid, req);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @ApiOperation({ summary: '補齊罰單/訂單資料' })
  @Patch(':lineUid/order/:orderNo')
  async updateTicketAndOrder(
    @Param('lineUid') lineUid: string,
    @Param('orderNo') orderNo: string,
    @Body() req: UpdateSimpleTicketReq,
  ): Promise<OrderDto> {
    return this.noAuthService.updateTicketsAndOrder(lineUid, orderNo, req);
  }

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Get(':lineUid/orders')
  async gerOrders(
    @Param('lineUid') lineUid: string,
    @Query('paymentStatus') paymentStatus: string,
    @Query('progress') progress: string,
  ) {
    return this.noAuthService.getOrders(lineUid, paymentStatus, progress);
  }

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @ApiOperation({ summary: 'Get order by orderNo' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiParam({ name: 'orderNo', description: 'Order No' })
  @Get(':lineUid/order/:orderNo')
  async getOrderForPayment(
    @Param('lineUid') lineUid: string,
    @Param('orderNo') orderNo: string,
  ): Promise<OrderDto> {
    return this.noAuthService.getOrderForPayment(lineUid, orderNo);
  }

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Get(':lineUid/order/:orderNo/price')
  @ApiOperation({ summary: 'Get order price' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiParam({ name: 'orderNo', description: 'Order No' })
  getServiceFeePrice(
    @Param('lineUid') lineUid: string,
    @Param('orderNo') orderNo: string,
  ): Promise<OrderFirstPriceDto> {
    return this.noAuthService.getFirstPrice(orderNo);
  }

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @Get(':lineUid/coupon/:couponCode')
  @ApiOperation({ summary: 'Get coupon discount' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiParam({ name: 'couponCode', description: 'Coupon code' })
  getCouponDiscount(
    @Param('lineUid') lineUid: string,
    @Param('couponCode') couponCode: string,
  ): Promise<CouponDiscountDto> {
    return this.noAuthService.getCouponDiscount(lineUid, couponCode);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @ApiOperation({ summary: 'Get payment page' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiParam({ name: 'orderNo', description: 'Order No' })
  @ApiBody({ type: CreatePaymentReqDto })
  @Post(':lineUid/order/:orderNo/payment')
  async createFirstPayment(
    @Param('lineUid') lineUid: string,
    @Param('orderNo') orderNo: string,
    @Body() body: CreatePaymentReqDto,
  ): Promise<FirstPaymentReq> {
    return this.noAuthService.firstPayment(lineUid, orderNo, body);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @ApiOperation({ summary: 'Create payment for zero' })
  @ApiParam({ name: 'lineUid', description: 'Line UID' })
  @ApiParam({ name: 'orderNo', description: 'Order No' })
  @Post(':lineUid/order/:orderNo/payment/zero')
  async createFirstPaymentForZero(
    @Param('lineUid') lineUid: string,
    @Param('orderNo') orderNo: string,
    @Body() body: CreatePaymentReqDto,
  ): Promise<OrderDto> {
    return this.noAuthService.firstPaymentFree(lineUid, orderNo, body);
  }
}
