import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Cron } from '@nestjs/schedule';
import taskConfig from '../../config/task.config';
import { TaskService } from './task.service';

const timeZone = 'Asia/Taipei';

@Injectable()
export class TaskScheduler {
  constructor(
    @InjectPinoLogger(TaskScheduler.name) private readonly logger: PinoLogger,
    private readonly taskService: TaskService,
  ) {
    this.logger.debug(
      { taskConfig: taskConfig() },
      'TaskScheduler initialized',
    );
  }

  @Cron('0 0 12 * * *', { timeZone })
  // 檢查和辨識資料
  async checkAndRecognize() {
    await this.taskService.checkAndRecognize();
  }
}
