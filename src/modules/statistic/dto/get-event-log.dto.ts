import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventLogStatusEnum } from './event-log.enum';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';

export class GetEventLogReq {
  @IsOptional()
  @IsNumber()
  readonly id?: number;
  @IsOptional()
  @IsDate()
  readonly time?: Date;
  @IsOptional()
  @IsEnum(EventLogStatusEnum)
  readonly status?: EventLogStatusEnum;
  @IsOptional()
  @IsEnum(TrackEventEnum)
  readonly event?: TrackEventEnum;
  @IsOptional()
  @IsString()
  readonly endpoint?: string;
  @IsOptional()
  readonly additionalInfo?: Record<string, any>;
  @IsOptional()
  @IsNumber()
  readonly userId?: number;
  @IsOptional()
  @IsNumber()
  readonly orderId?: number;
}

export class GetEventLogRes {
  readonly time: Date;
  readonly status: EventLogStatusEnum;
  readonly event: TrackEventEnum;
  readonly endpoint: string;
  readonly additionalInfo: Record<string, any>;
  readonly userId: number;
  readonly orderId: number;

  constructor(data: Partial<GetEventLogRes>) {
    Object.assign(this, data);
  }
}
