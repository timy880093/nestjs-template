// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { CommonUtil } from '../../common/util/common.util';
// import { MqEnum } from '../../third-party/mq/mq.enum';
// import { AdminService } from './admin.service';
// import { TicketException } from '../../common/exception/ticket.exception';
// import { ProgressEmailDto } from '../ticket/dto/progress-email.dto';
//
// @Processor('admin')
// export class AdminConsumer extends WorkerHost {
//   constructor(private readonly adminService: AdminService) {
//     super();
//   }
//
//   async process(job: Job<any, any, string>): Promise<any> {
//     switch (CommonUtil.stringToEnum(MqEnum, job.name)) {
//       case MqEnum.PROGRESS_EMAIL_QUEUE:
//         return this.adminService.sendOrderProgressEmail(
//           job.data as ProgressEmailDto,
//         );
//       default:
//         throw new TicketException(
//           `queue name(${job.name}) is invalid: ${MqEnum}`,
//         );
//     }
//   }
// }
