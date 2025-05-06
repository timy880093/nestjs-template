import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvoiceReissueReqDto } from '../dto/invoice-reissue-req.dto';
import { AdminService } from '../admin.service';
import { ApiOperation } from '@nestjs/swagger';
import { AdminGuard } from '../../../common/guard/admin.guard';
import { TransactionCancelReq } from '../../ticket/dto/transaction-cancel.req';

@UseGuards(AdminGuard)
@Controller('admin/transaction')
export class AdminTransactionController {
  constructor(private readonly adminService: AdminService) {}

  // @Public()
  @Post('invoice/reissue')
  async reissueInvoice(@Body() { tradeNos }: InvoiceReissueReqDto) {
    return this.adminService.reissueInvoice(tradeNos);
  }

  //TODO
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Retool] 取消交易&退款' })
  @Patch(':tradeNo/cancel')
  async cancelPayment(@Param() req: TransactionCancelReq) {
    return this.adminService.cancelTransaction(req);
  }
}
