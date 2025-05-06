import { ProgressEnum } from '../enums/order.enum';
import { UserDto } from '../../users/dto/user.dto';
import { TicketDto } from './ticket.dto';
import { TicketSubmissionDto } from './ticket-submission.dto';
import { SourceEnum } from '../../../common/dto/source.enum';

export class OrderPublicDto {
  userId: number;
  orderNo: string;
  groupName: string;
  progress: ProgressEnum;
  generatedClaim: string;
  userStatement: string;
  finalClaim: string;
  answeredClaim: Record<string, any> | Record<string, any>[];
  queryInfo: Record<string, any> | Record<string, any>[];
  remark: string;
  source: SourceEnum;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date;
  submittedAt: Date;
  receivedAt: Date;
  user?: UserDto;
  tickets?: TicketDto[];
  ticketSubmissions?: TicketSubmissionDto[];

  constructor(data: Partial<OrderPublicDto>) {
    Object.assign(this, data);
  }
}
