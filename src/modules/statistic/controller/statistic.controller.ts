import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guard/admin.guard';
import { EventLogService, StatisticService } from '../service';
import { GetEventLogReq, GetEventLogRes } from '../dto';

@UseGuards(AdminGuard)
@Controller('statistic')
export class StatisticController {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly eventLogService: EventLogService,
  ) {}

  // @Throttle({ default: { ttl: 60000, limit: 30 } })
  // @ApiOperation({ summary: '取得追蹤事件點擊次數' })
  // @Get('track-event')
  // async getAllTrackEvent(
  //   @Query() req: GetTrackEventReq,
  //   // @Query('event') event: TrackEventEnum,
  //   // @Query('start') start: string,
  //   // @Query('end') end: string,
  // ): Promise<Record<string, any>> {
  //   return this.statisticService.getEventTimes(req);
  // }

  // @Post('event-log')
  // async createEventLog(
  //   @Body() req: CreateEventLogReq,
  // ): Promise<CreateEventLogRes> {
  //   return this.eventLogService.createEventLog(req);
  // }

  @Get('event-log')
  async getEventLog(@Query() req: GetEventLogReq): Promise<GetEventLogRes[]> {
    return this.eventLogService.getEventLogs(req);
  }
}
