import { ProgressEnum } from '../../ticket/enums/order.enum';
import { Transform } from 'class-transformer';
import { DateUtil } from '../../../common/util';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { TicketSubmissionDto } from '../../ticket/dto/ticket-submission.dto';
import { AppealResultEnum } from '../../ticket/enums/ticket.enum';
import { OrderDto } from '../../ticket/dto/order.dto';

export class UpdateToProcessingReq {
  @IsIn([ProgressEnum.PROCESSING])
  progress: ProgressEnum = ProgressEnum.PROCESSING;
  @IsNumber()
  claimUserId: number;
  @IsOptional()
  @Transform(({ value }) => (value ? DateUtil.zoneDayjs(value).toDate() : null))
  @IsDate()
  processedAt: Date;
  @IsOptional()
  @IsEmail()
  email?: string;

  toOrder(): OrderDto {
    return new OrderDto({
      progress: this.progress,
      claimUserId: this.claimUserId,
      processedAt: this.processedAt || new Date(),
    });
  }
}

export class UpdateToSubmittedReq {
  @IsIn([ProgressEnum.SUBMITTED])
  progress: ProgressEnum = ProgressEnum.SUBMITTED;
  @Transform(({ value }) => (value ? DateUtil.zoneDayjs(value).toDate() : null))
  @IsDate()
  submittedAt: Date;
  @IsObject()
  queryInfo: Record<string, any>;
  @IsArray()
  ticketSubmissionIds: number[];

  toOrder(): OrderDto {
    return new OrderDto({
      progress: this.progress,
      submittedAt: this.submittedAt || new Date(),
    });
  }

  toTicketSubmissionDto(): TicketSubmissionDto {
    return new TicketSubmissionDto({
      queryInfo: this.queryInfo,
    });
  }
}

export class UpdateToCompletedReq {
  @IsOptional()
  @IsIn([
    ProgressEnum.APPROVED,
    ProgressEnum.PARTIAL_APPROVED,
    ProgressEnum.REJECTED,
  ])
  progress: ProgressEnum;
  @IsOptional()
  @Transform(({ value }) => (value ? DateUtil.zoneDayjs(value).toDate() : null))
  @IsDate()
  receivedAt: Date;
  resultUserId: number;

  @IsArray()
  ticketSubmissionIds: number[];
  @IsOptional()
  @IsEnum(AppealResultEnum)
  appealResult: AppealResultEnum; //申訴結果
  @IsOptional()
  @IsNumber()
  violationFine: number; //原始罰金
  @IsOptional()
  @IsNumber()
  appealViolationFine: number; //申訴後罰金
  @IsOptional()
  @IsString()
  appealViolationPenalty: string; //申訴後罰則
  @IsOptional()
  @Transform(({ value }) => (value ? DateUtil.zoneDayjs(value).toDate() : null))
  @IsDate()
  appealExpiresAt: Date; //申訴後到期日

  toOrder(): OrderDto {
    return new OrderDto({
      progress: this.progress,
      receivedAt: this.receivedAt || new Date(),
      resultUserId: this.resultUserId,
    });
  }

  toTicketSubmissionDto(): TicketSubmissionDto {
    return new TicketSubmissionDto({
      violationFine: this.violationFine,
      appealViolationFine: this.appealViolationFine,
      appealResult: this.appealResult,
      appealExpiresAt: this.appealExpiresAt,
      appealViolationPenalty: this.appealViolationPenalty,
    });
  }
}
