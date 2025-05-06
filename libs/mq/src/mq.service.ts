import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MqEnum } from './mq.enum';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class MqService {
  constructor(
    @InjectPinoLogger(MqService.name) private readonly logger: PinoLogger,
    @InjectQueue('admin') private readonly defaultQueue: Queue,
  ) {}

  async add(
    name: MqEnum,
    data: any,
    delay?: number,
    retry?: number,
    retryDelay?: number,
  ): Promise<Job> {
    // name 必須轉 string，否則 consumer 無法接收
    return this.defaultQueue.add(name.toString(), data, {
      delay: delay, // 延遲時間
      attempts: retry || 3, // 重試次數
      backoff: {
        type: 'fixed', // 重試策略
        delay: retryDelay || 5000, // 間隔時間
      },
    });
  }

  async getWaitingJobs(): Promise<Job[]> {
    return this.defaultQueue.getWaiting();
  }

  async getActiveJobs(): Promise<Job[]> {
    return this.defaultQueue.getActive();
  }

  async getCompletedJobs(): Promise<Job[]> {
    return this.defaultQueue.getCompleted();
  }

  async getFailedJobs(): Promise<Job[]> {
    return this.defaultQueue.getFailed();
  }

  async getDelayedJobs(): Promise<Job[]> {
    return this.defaultQueue.getDelayed();
  }

  async getJobById(id: string): Promise<Job> {
    return this.defaultQueue.getJob(id);
  }

  async removeJobById(id: string): Promise<void> {
    const job = await this.defaultQueue.getJob(id);
    if (job) await job.remove();
    this.logger.debug({ id }, 'removeJobById: ');
  }

  async removeJobsByIds(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.removeJobById(id);
    }
  }

  async removeAllJobs(): Promise<void> {
    await this.defaultQueue.obliterate({ force: true });
    this.logger.debug('removeAllJobs done');
  }
}
