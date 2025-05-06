import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Cron } from '@nestjs/schedule';
import { TicketAppealService } from '../ticket/shared/ticket-appeal.service';
import taskConfig from '../../config/task.config';
import { TaskService } from './task.service';

const timeZone = 'Asia/Taipei';

@Injectable()
export class TaskScheduler {
  constructor(
    @InjectPinoLogger(TaskScheduler.name) private readonly logger: PinoLogger,
    private readonly ticketAppealService: TicketAppealService,
    private readonly taskService: TaskService,
  ) {
    this.logger.debug(
      { taskConfig: taskConfig() },
      'TaskScheduler initialized',
    );
  }

  // 檢查機器人失敗通知
  @Cron(taskConfig().checkBotCron, { timeZone })
  async notifyOnBotFailed() {
    if (!taskConfig().enableTask) return;
    await this.ticketAppealService.notifyOnBotFailed();
  }

  @Cron(taskConfig().notifyIncompleteCron, { timeZone })
  // 簡易罰單未補齊資料通知
  async notifyOnIncompleteOrder() {
    if (!taskConfig().enableTask) return;
    await this.ticketAppealService.notifyOnIncompleteOrder();
  }

  @Cron(taskConfig().notifyIncompleteCron, { timeZone })
  // 檢查和辨識資料
  async checkAndRecognize() {
    if (!taskConfig().enableTask) return;
    await this.taskService.checkAndRecognize();
  }
}
