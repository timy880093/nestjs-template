import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketAppealService } from '../shared/ticket-appeal.service';
import { Public } from '../../../common/decorator/public.decorator';
import { NewebpayNotifyReq } from '../../../third-party/payment/dto/newebpay/newebpay-notify.req';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OrderService } from '../service/order.service';
import { AfteeNotifyReq } from '../../../third-party/payment/dto/aftee/aftee-notify.req';
import { AfteeReturnReq } from '../../../third-party/payment/dto/aftee/aftee-return.req';

@ApiTags('order/payment')
@Controller('order/payment')
export class OrderPaymentController {
  constructor(
    @InjectPinoLogger(OrderPaymentController.name)
    private readonly logger: PinoLogger,
    private readonly orderService: OrderService,
    private readonly ticketAppealService: TicketAppealService,
  ) {}

  // 回給藍新的 notify
  @Public()
  @Post(['notify', 'newebpay/notify'])
  @ApiOperation({ summary: 'Newebpay payment notify' })
  @ApiResponse({ status: 200, description: 'Return payment notify' })
  async newebpayPaymentNotify(@Body() body: NewebpayNotifyReq): Promise<void> {
    // this.logger.debug({ body }, 'newebpayPaymentNotify: ');
    await this.ticketAppealService.paymentNotify(body);
  }

  @Public()
  @Post(['return', 'newebpay/return'])
  @ApiOperation({ summary: 'Newebpay payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async newebpayPaymentReturn(@Res() res: any, @Body() body: any) {
    const url = await this.ticketAppealService.getPaymentReturnUrl(body);
    this.logger.debug({ url }, 'newebpayPaymentReturn: ');
    res.redirect(HttpStatus.FOUND, url);
  }

  @Public()
  @Post('aftee/notify')
  @ApiOperation({ summary: 'Aftee payment notify' })
  @ApiResponse({ status: 200, description: 'Return payment notify' })
  async afteePaymentNotify(@Body() body: AfteeNotifyReq): Promise<void> {
    return this.ticketAppealService.paymentNotify(body);
  }

  @Public()
  @Get('aftee/return')
  @ApiOperation({ summary: 'Aftee payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async afteePaymentReturn(@Res() res: any, @Query() query: AfteeReturnReq) {
    const url = await this.ticketAppealService.getPaymentReturnUrl(query);
    res.redirect(HttpStatus.FOUND, url);
  }
}
