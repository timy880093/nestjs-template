import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation } from '@nestjs/swagger';
import { StatisticService } from '../service';
import { Public } from '../../../common/decorator/public.decorator';
import { CreateEventLogReq } from '../dto';
import { ApiKeyGuard } from '../../../common/guard/api-key.guard';
import { Super8InfoService } from '../service';
import { GetSuper8TagReq, GetSuper8TagRes } from '../dto';

@Public()
@Controller('public/statistic')
export class StatisticPublicController {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly super8RefService: Super8InfoService,
  ) {}

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @ApiOperation({ summary: '追蹤事件點擊次數' })
  @Post('track-event')
  async recordTrackEvent(@Body() req: CreateEventLogReq) {
    await this.statisticService.recordTrackEvent(req);
  }

  @UseGuards(ApiKeyGuard)
  @Get('super8/ref-tag')
  async getSuper8RefTag(
    @Query() req: GetSuper8TagReq,
  ): Promise<GetSuper8TagRes> {
    return this.super8RefService.getSuper8RefTags(req);
  }
}
