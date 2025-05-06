import { Body, Controller, Param, Patch } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { BotStatusUpdateReqDto } from '../dto/bot-status-update.req.dto';
import { TicketSubmissionDto } from '../../ticket/dto/ticket-submission.dto';
import { ApiOperation } from '@nestjs/swagger';
import { TicketSubmissionUpdateReqDto } from '../dto/ticket-submission-update.req.dto';

@Controller('admin/ticket-submission')
export class AdminTicketSubmissionController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '[For Bot] Update bot status' })
  @Patch(':id/bot')
  async updateBotStatus(
    @Param('id') id: number,
    @Body() dto: BotStatusUpdateReqDto,
  ): Promise<TicketSubmissionDto[]> {
    return this.adminService.updateBotStatus(id, dto);
  }

  @ApiOperation({ summary: '[For Retool] Update appeal result' })
  @Patch()
  async updateTicketSubmissions(
    @Body() dto: TicketSubmissionUpdateReqDto,
  ): Promise<TicketSubmissionDto[]> {
    return this.adminService.updateTicketSubmissions(dto);
  }
}
