import { TicketSubmissionDto } from '../../ticket/dto/ticket-submission.dto';
import { BotSubmittedStatusEnum } from '../../ticket/enums/ticket.enum';
import { plainToInstance } from 'class-transformer';

export class BotStatusUpdateReqDto {
  botSubmittedStatus: BotSubmittedStatusEnum;
  botSubmittedAt: Date;
  botSuccessAt: Date;
  queryInfo: Record<string, any>;

  constructor(data: Partial<BotStatusUpdateReqDto>) {
    Object.assign(this, data);
  }

  toTicketSubmissionDto(): TicketSubmissionDto {
    switch (this.botSubmittedStatus) {
      case BotSubmittedStatusEnum.PROCESSING:
        if (!this.botSubmittedAt) this.botSubmittedAt = new Date();
        break;
      case BotSubmittedStatusEnum.SUCCESSFUL:
        if (!this.botSuccessAt) this.botSuccessAt = new Date();
        break;
    }
    return plainToInstance(TicketSubmissionDto, this);
  }
}
