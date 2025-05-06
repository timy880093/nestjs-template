import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TicketAppealService } from '../shared/ticket-appeal.service';
import { Public } from '../../../common/decorator/public.decorator';
import { OrderSecondPriceDto } from '../dto/order-price.dto';
import { CreatePaymentReqDto } from '../dto/create-payment.req.dto';
import { NewebpayReq } from '../../../third-party/payment/dto/newebpay/newebpay.req';
import { OrderPublicDto } from '../dto/order-public.dto';

@Public()
@ApiTags('public/order')
@Controller('public/order')
export class OrderPublicController {
  constructor(
    @InjectPinoLogger(OrderPublicController.name)
    private readonly logger: PinoLogger,
    private readonly ticketAppealService: TicketAppealService,
  ) {}

  @Get(':orderNo/appeal-success')
  @ApiOperation({ summary: '取得二階段付款的 order 資訊' })
  @ApiResponse({ status: 200, description: 'Return public order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderNo', description: '訂單編號' })
  async getOrderForSecond(
    @Param('orderNo') orderNo: string,
  ): Promise<OrderPublicDto> {
    return this.ticketAppealService.getOrderForSecond(orderNo);
  }

  @Get(':orderNo/appeal-success/price')
  @ApiOperation({ summary: '取得二階段付款的金額' })
  @ApiResponse({ status: 200, description: 'Return success-price' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderNo', description: '訂單編號' })
  async getOrderSecondPrice(
    @Param('orderNo') orderNo: string,
  ): Promise<OrderSecondPriceDto> {
    return this.ticketAppealService.getOrderSecondPrice(orderNo);
  }

  @Post(':orderNo/appeal-success/payment')
  @ApiOperation({ summary: '二階段付款' })
  @ApiResponse({ status: 200, description: '' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'orderNo', description: '訂單編號' })
  @ApiBody({ type: CreatePaymentReqDto })
  async createSecondPayment(
    @Param('orderNo') orderNo: string,
    @Body() { paymentProvider }: CreatePaymentReqDto,
  ): Promise<NewebpayReq> {
    this.logger.debug({ paymentProvider, orderNo }, 'createSecondPayment: ');
    return this.ticketAppealService.secondPaymentForNewebpay(orderNo);
  }

  // 二階段：只有藍新需 return 付款頁
  @Post('/:orderNo/appeal-success/payment/success')
  @ApiOperation({ summary: 'Newebpay payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async newebpayPaymentReturn(@Res() res: any, @Body() body: any) {
    const url = await this.ticketAppealService.getPaymentReturnUrl(body);
    this.logger.debug({ url }, 'newebpayPaymentReturn: ');
    res.redirect(HttpStatus.FOUND, url);
  }
}
