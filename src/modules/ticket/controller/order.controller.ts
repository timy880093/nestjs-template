import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderDto } from '../dto/order.dto';
import { TicketAppealService } from '../shared/ticket-appeal.service';
import { OrderFirstPriceDto } from '../dto/order-price.dto';
import { OrderUpdateDto } from '../dto/order-update.dto';
import { UserId } from '../../../common/decorator/user-id.decorator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OrderService } from '../service/order.service';
import { CreatePaymentReqDto } from '../dto/create-payment.req.dto';
import { FirstPaymentReq } from '../../../third-party/payment/dto/payment-notify.type';
import {
  TokenUser,
  UserInfo,
} from '../../../common/decorator/token-user.decorator';
import { CouponDiscountDto } from '../dto/coupon-discount.dto';

@ApiTags('order')
@Controller('order')
export class OrderController {
  constructor(
    @InjectPinoLogger(OrderController.name)
    private readonly logger: PinoLogger,
    private readonly orderService: OrderService,
    private readonly ticketAppealService: TicketAppealService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders with tickets' })
  @ApiResponse({ status: 200, description: 'Return all orders with tickets' })
  findAll(
    @UserId() userId: number,
    @Query('paymentStatus') paymentStatus: string,
  ): Promise<OrderDto[]> {
    return this.orderService.findOrdersByPaymentStatus(
      { userId },
      paymentStatus,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Return order by id' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  findOne(@Param('id') id: number): Promise<OrderDto> {
    return this.orderService.findOneById(id, true);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Return updated order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  updateOrder(
    @TokenUser() userInfo: UserInfo,
    // @UserId() userId: number,
    @Param('id') id: number,
    @Body() dto: OrderUpdateDto,
  ): Promise<OrderDto> {
    return this.ticketAppealService.updateOrderForDecision(id, userInfo, dto);
  }

  @Get(':id/price')
  @ApiOperation({ summary: 'Get order price' })
  @ApiResponse({ status: 200, description: 'Return order price' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getServiceFeePrice(@Param('id') id: number): Promise<OrderFirstPriceDto> {
    this.logger.debug({ id }, 'getPrice: ');
    return this.ticketAppealService.getFirstPriceById(id);
  }

  @Get(':id/dynamic-price')
  @ApiOperation({ summary: 'Get dynamic order price' })
  @ApiResponse({ status: 200, description: 'Return dynamic order price' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getDynamicOrderPrice(@Param('id') id: number): Promise<OrderFirstPriceDto> {
    return this.ticketAppealService.getDynamicFirstPrice(id);
  }

  @Get('coupon/:couponCode')
  @ApiOperation({ summary: 'Get coupon discount' })
  @ApiResponse({ status: 200, description: 'Return coupon discount' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  @ApiParam({ name: 'couponCode', description: 'Coupon code' })
  getCouponDiscount(
    @UserId() userId: number,
    @Param('couponCode') couponCode: string,
  ): Promise<CouponDiscountDto> {
    return this.ticketAppealService.getCouponDiscount(userId, couponCode);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Get payment page' })
  @ApiResponse({ status: 200, description: 'Return payment page' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: CreatePaymentReqDto })
  async createFirstPayment(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
    @Body() body: CreatePaymentReqDto,
  ): Promise<FirstPaymentReq> {
    this.logger.debug({ id, body }, 'createFirstPayment: ');
    return this.ticketAppealService.firstPaymentById(id, body, userInfo);
  }

  @Post(':id/payment/zero')
  @ApiOperation({ summary: 'Create payment for zero' })
  @ApiResponse({ status: 200, description: 'Return payment page' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  async createFirstPaymentForZero(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
    @Body() body: CreatePaymentReqDto,
  ): Promise<OrderDto> {
    this.logger.debug({ id, body }, 'createFirstPaymentForZero: ');
    return this.ticketAppealService.firstPaymentFreeById(id, body, userInfo);
  }

  @Get('appeal-success/unpaid')
  @ApiOperation({ summary: '取得該使用者未繳成效金的所有訂單' })
  @ApiResponse({
    status: 200,
    description: 'Return appeal-success unpaid order',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  getSecondUnpaidOrder(@UserId() userId: number): Promise<OrderDto[]> {
    return this.ticketAppealService.getSecondUnpaidOrder(userId);
  }

  // @UseGuards(AdminGuard)
  // @Post(':orderNo/appeal-success/payment/aftee')
  // @ApiOperation({ summary: 'AFTEE 成效金二次付款' })
  // @ApiResponse({ status: 200, description: 'createSecondPayment result' })
  // @ApiResponse({ status: 404, description: 'Order not found' })
  // @ApiParam({ name: 'id', description: 'Order ID' })
  // createSecondPayment(
  //   @Param('orderNo') orderNo: string,
  // ): Promise<TransactionDto> {
  //   return this.ticketAppealService.secondPaymentForAftee(orderNo);
  // }

  // @Get(':id/payment/link')
  // async createPaymentLink(
  //   @UserId() userId: number,
  //   @Param('id') id: number,
  //   @Body() body: CreatePaymentReqDto,
  //   @Res() res: any,
  // ): Promise<void> {
  //   const { url, html } =
  //     await this.ticketAppealService.createPaymentLinkForAmount(
  //       userId,
  //       id,
  //       body,
  //     );
  //   if (html) {
  //     res.set('Content-Type', 'text/html');
  //     res.send(html);
  //   } else if (url) res.redirect(url);
  //   else
  //     throw new HttpException(
  //       'Failed to create payment',
  //       HttpStatus.BAD_REQUEST,
  //     );
  // }
}
