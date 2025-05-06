import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CommonUtil } from '../../common/util';
import { MqEnum } from '../../third-party/mq/mq.enum';
import { TicketException } from '../../common/exception/ticket.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MqConsumerService } from './mq-consumer.service';

@Processor('admin')
export class MqConsumerProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(MqConsumerProcessor.name)
    private readonly logger: PinoLogger,
    private readonly mqConsumerService: MqConsumerService,
  ) {
    super();
    this.logger.debug('MqConsumerService initialized');
  }

  // @OnWorkerEvent('active')
  // onActive(job: Job) {
  //   const { id, name, queueName, timestamp } = job;
  //   const startTime = timestamp ? new Date(timestamp).toISOString() : '';
  //   this.logger.debug({ id, name, queueName }, `Job active`);
  // }
  //
  // @OnWorkerEvent('completed')
  // onCompleted(job: Job) {
  //   const { id, name, queueName, finishedOn, returnvalue } = job;
  //   const completionTime = finishedOn ? new Date(finishedOn).toISOString() : '';
  //   this.logger.debug({ id, name, queueName }, `Job completed`);
  // }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const { id, name, queueName, failedReason } = job;
    this.logger.error({ id, name, queueName, failedReason }, `Job failed`);
  }

  async process({ name, data }: Job<any, any, string>): Promise<any> {
    // const remainingLength = (await this.mqService.getActiveJobs()).length;
    this.logger.debug({ name, data }, 'Job process entry');
    const queue = CommonUtil.stringToEnum(MqEnum, name);
    switch (queue) {
      case MqEnum.PROGRESS_EMAIL_QUEUE:
        // this.logger.debug('PROGRESS_EMAIL_QUEUE entry');
        // return this.adminService.sendOrderProgressEmail(
        //   data as ProgressEmailDto,
        // );
        return;
      case MqEnum.ISSUE_INVOICE_QUEUE:
        // this.logger.debug('ISSUE_INVOICE_QUEUE entry');
        return;
      case MqEnum.RECOGNIZE_QUEUE:
        // this.logger.debug('RECOGNIZE_QUEUE entry');
        const { orderId } = data;
        await this.mqConsumerService.checkAndUpdateOrderRecognized(
          orderId as number,
        );
        return;
      default:
        throw new TicketException(`queue(${name}) is invalid`);
    }
  }
}
