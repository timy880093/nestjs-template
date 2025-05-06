import { Body, Controller, Post } from '@nestjs/common';
import { NoAuthService } from './no-auth.service';
import { Public } from '../../common/decorator/public.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateEventLogReq } from '../statistic/dto';

@Public()
@Controller('no-auth')
export class NoAuthController {
  constructor(private readonly noAuthService: NoAuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @ApiOperation({ summary: '追蹤事件點擊次數' })
  @Post('track')
  async recordTrackEvent(@Body() req: CreateEventLogReq) {
    await this.noAuthService.recordSuccessEvent(req.event);
  }
}
