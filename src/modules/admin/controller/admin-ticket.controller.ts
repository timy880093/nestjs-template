import { Body, Controller, Param, Post } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { ApiOperation } from '@nestjs/swagger';
import { TicketDto } from '../../ticket/dto/ticket.dto';

@Controller('admin/ticket')
export class AdminTicketController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '[For Retool] 複製 ticket & submission' })
  @Post(':id/duplicate')
  async duplicateTicket(
    @Param('id') id: number,
    @Body('newTicketNo') newTicketNo: string,
  ): Promise<TicketDto> {
    return this.adminService.duplicateTicket(id, newTicketNo);
  }
}
