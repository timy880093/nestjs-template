import { IsEnum, IsOptional } from 'class-validator';
import { EventLogStatusEnum } from './event-log.enum';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';

export class CreateEventLogReq {
  @IsOptional()
  @IsEnum(EventLogStatusEnum)
  readonly status: EventLogStatusEnum;
  @IsEnum(TrackEventEnum)
  readonly event: TrackEventEnum;

  constructor(data: Partial<CreateEventLogReq>) {
    Object.assign(this, data);
  }
}

export class CreateEventLogRes {
  readonly id: number;
  readonly time: Date;
  readonly status: EventLogStatusEnum;
  readonly event: TrackEventEnum;
  readonly endpoint: string;
  readonly additionalInfo: Record<string, any>;
  readonly userId: number;
  readonly orderId: number;

  constructor(data: Partial<CreateEventLogRes>) {
    Object.assign(this, data);
  }
}
