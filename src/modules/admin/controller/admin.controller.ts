import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetTrackEventReq } from '../../statistic/dto';
import { AdminService } from '../admin.service';
import { AdminGuard } from '../../../common/guard/admin.guard';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TicketDto } from '../../ticket/dto/ticket.dto';
import {
  TokenUser,
  UserInfo,
} from '../../../common/decorator/token-user.decorator';
import { SendFreeGiftCardEdmDto } from '../dto/send-free-gift-card-edm.dto';

@Controller('admin')
@UseGuards(AdminGuard, ThrottlerGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('ticket/:id/re-group')
  @SkipThrottle()
  // @UsePipes(new ValidationPipe({ groups: ['non_draft'] }))
  @ApiOperation({
    summary: '將罰單重新分組',
    description: '將罰單重新分組',
  })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  reGroupTicket(
    @TokenUser() userInfo: UserInfo,
    @Param('id') id: number,
  ): Promise<TicketDto> {
    return this.adminService.reGroupTicket(id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import from Google Sheet' })
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
  importFromGoogleSheet(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    return this.adminService.importFromGoogleSheet(file);
  }

  @Post('mail/gift-card-edm')
  async sendOneTimeGiftCardEdm(
    @Body('subject') subject: string,
    @Body('template') template: string,
    @Body('to') to: string[],
  ) {
    return this.adminService.sendOneTimeGiftCardEdm(subject, template, to);
  }

  @Post('mail/gift-card-edm-free')
  async sendVipGiftCardEdm(@Body() dto: SendFreeGiftCardEdmDto) {
    return this.adminService.sendFreeGiftCardEdm(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({ summary: '取得追蹤事件點擊次數' })
  @Get('track-event')
  async getAllTrackEvent(
    @Query() req: GetTrackEventReq,
    // @Query('event') event: TrackEventEnum,
    // @Query('start') start: string,
    // @Query('end') end: string,
  ): Promise<Record<string, any>> {
    return this.adminService.getEventTimes(req);
  }

  // @Post('lost-import')
  // @UseInterceptors(FileInterceptor('file'))
  // @ApiOperation({ summary: 'Import from Google Sheet' })
  // @ApiConsumes('multipart/form-data')
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       file: {
  //         type: 'string',
  //         format: 'binary',
  //       },
  //     },
  //   },
  // })
  // findLostImportData(@UploadedFile() file: Express.Multer.File): Promise<any> {
  //   return this.adminService.findLostImportData(file);
  // }
}
