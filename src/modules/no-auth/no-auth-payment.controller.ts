import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { NoAuthService } from './no-auth.service';
import { Public } from '../../common/decorator/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AfteeReturnReq } from '../../third-party/payment/dto/aftee/aftee-return.req';
import { NewebpayNotifyReq } from '../../third-party/payment/dto/newebpay/newebpay-notify.req';
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { ttl: 60000, limit: 100 } })
@Public()
@Controller('no-auth/payment')
export class NoAuthPaymentController {
  constructor(private readonly publicService: NoAuthService) {}

  @Post('newebpay/return')
  @ApiOperation({ summary: 'Newebpay payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async newebpayPaymentReturn(@Res() res: any, @Body() req: NewebpayNotifyReq) {
    const url = await this.publicService.getPaymentReturnUrl(req);
    res.redirect(HttpStatus.FOUND, url);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @Get('aftee/return')
  @ApiOperation({ summary: 'Aftee payment return' })
  @ApiResponse({ status: 302, description: 'Redirect to payment' })
  async afteePaymentReturn(@Res() res: any, @Query() req: AfteeReturnReq) {
    const url = await this.publicService.getPaymentReturnUrl(req);
    res.redirect(HttpStatus.FOUND, url);
  }
}
