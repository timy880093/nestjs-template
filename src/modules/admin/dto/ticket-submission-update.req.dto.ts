import { TicketSubmissionDto } from '../../ticket/dto/ticket-submission.dto';
import { AppealResultEnum } from '../../ticket/enums/ticket.enum';
import { plainToInstance } from 'class-transformer';

export class TicketSubmissionUpdateReqDto {
  ids: number | number[];
  queryInfo: Record<string, any>;
  appealResult: AppealResultEnum;
  appealExpiresAt: Date;
  appealViolationPenalty: string;

  constructor(dto: Partial<TicketSubmissionUpdateReqDto>) {
    return plainToInstance(TicketSubmissionUpdateReqDto, dto);
  }

  toTicketSubmissionDto(): TicketSubmissionDto {
    return plainToInstance(TicketSubmissionDto, this.build());
  }

  build(): TicketSubmissionUpdateReqDto {
    if (this.appealResult && !this.appealExpiresAt)
      this.appealExpiresAt = new Date();
    return this;
  }
}
