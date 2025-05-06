import { Module } from '@nestjs/common';
import { TaskScheduler } from './task.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { TicketModule } from '../ticket/ticket.module';
import { TaskService } from './task.service';

@Module({
  imports: [ScheduleModule.forRoot(), TicketModule],
  providers: [
    TaskScheduler,
    TaskService,
    // {
    //   provide: TaskScheduler,
    //   useFactory: (
    //     logger: PinoLogger,
    //     ticketAppealService: TicketAppealService,
    //   ) => {
    //     if (taskConfig().enableTask) {
    //       return new TaskScheduler(logger, ticketAppealService);
    //     }
    //     return undefined;
    //   },
    // },
  ],
})
export class TaskModule {}
