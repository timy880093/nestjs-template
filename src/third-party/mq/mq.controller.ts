import { Controller, Get, UseGuards } from '@nestjs/common';
import { MqService } from './mq.service';
import { Job } from 'bullmq';
import { AdminGuard } from '../../common/guard/admin.guard';

@Controller('mq')
@UseGuards(AdminGuard)
export class MqController {
  constructor(private readonly mqService: MqService) {}

  @Get('delayed')
  async getDelayedJobs(): Promise<Job[]> {
    return this.mqService.getDelayedJobs();
  }

  @Get('waiting')
  async getWaitingJobs(): Promise<Job[]> {
    return this.mqService.getWaitingJobs();
  }

  @Get('failed')
  async getFailedJobs(): Promise<Job[]> {
    return this.mqService.getFailedJobs();
  }

  // @Delete('all')
  // async removeAllJobs(): Promise<void> {
  //   return this.mqService.removeAllJobs();
  // }
}
