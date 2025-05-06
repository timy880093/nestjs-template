import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from '../admin.service';
import { ApiOperation } from '@nestjs/swagger';
import {
  UpdateToCompletedReq,
  UpdateToProcessingReq,
  UpdateToSubmittedReq,
} from '../dto/admin-progress.req';
import { AdminGuard } from '../../../common/guard/admin.guard';
import { AdminSecondPaymentReq } from '../dto/admin-second-payment.req';
import { SendProgressMailReq } from '../dto/send-progress-mail.req';

@UseGuards(AdminGuard)
@Controller('admin/order')
export class AdminOrderController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '[Retool] 更新訂單狀態：處理中，並寄信' })
  @Patch(':id/progress/processing')
  async updateToProcessingAndSendEmail(
    @Param('id') id: number,
    @Body() dto: UpdateToProcessingReq,
  ) {
    return this.adminService.updateToProcessingAndSendMail(id, dto);
  }

  @ApiOperation({ summary: '[Retool] 更新訂單狀態：已送審' })
  @Patch(':id/progress/submitted')
  async updateToSubmitted(
    @Param('id') id: number,
    @Body() dto: UpdateToSubmittedReq,
  ) {
    return this.adminService.updateToSubmitted(id, dto);
  }

  @ApiOperation({ summary: '[Retool] 寄信：已送審' })
  @Post('progress-mail')
  async sendProgressEmail(@Body() req: SendProgressMailReq) {
    return this.adminService.sendOrderProgressEmailById(req);
  }

  // @ApiOperation({ summary: '[Retool] Update order progress' })
  // @Patch(':id/progress')
  // async updateOrderProgress(@Body() dto: AdminOrderUpdateDto) {
  //   return this.adminService.updateOrderProgress(dto);
  // }
  //

  @ApiOperation({ summary: '[Retool] 更新罰單申訴結果/訂單狀態，不寄信' })
  @Patch(':id/progress/done')
  async checkAndUpdateToCompleted(
    @Param('id') id: number,
    @Body() dto: UpdateToCompletedReq,
  ) {
    return this.adminService.checkAndUpdateToCompleted(id, dto);
  }

  @ApiOperation({
    summary: '[Retool] 二階段付款，Newebpay寄出付款通知信/AFTEE直接扣款',
  })
  @Post(':orderNo/appeal-success/payment')
  async secondPaymentAndSendMail(
    @Param('orderNo') orderNo: string,
    @Body() adminSecondPaymentReq: AdminSecondPaymentReq,
  ) {
    return this.adminService.secondPaymentAndSendMail(
      orderNo,
      adminSecondPaymentReq,
    );
  }

  @ApiOperation({
    summary: '[Retool] 寄出失敗通知信',
  })
  @Post(':orderNo/appeal-fail/email')
  async sendRejectMail(
    @Param('orderNo') orderNo: string,
    @Body('email') email: string,
  ) {
    return this.adminService.sendRejectMail(orderNo, email);
  }

  @ApiOperation({
    summary: '檢查訂單內的罰單是否都有辨識資料',
  })
  @Post(':orderId/recognize')
  async checkOrderRecognized(@Param('orderId') orderId: number) {
    return this.adminService.checkOrderRecognized(orderId);
  }

  // @ApiOperation({ summary: '[Retool] 計算二階段付款金額' })
  // @Get(':orderNo/appeal-success/price')
  // async calculateSecondPayment(
  //   @Param('orderNo') orderNo: string,
  // ): Promise<OrderSecondPriceDto> {
  //   return this.adminService.calculateSecondPayment(orderNo);
  // }
}
