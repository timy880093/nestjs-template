import { plainToInstance } from 'class-transformer';
import { ProgressEnum } from '../enums/order.enum';
import { TicketDto } from './ticket.dto';
import { TransactionDto } from './transaction.dto';
import { UploadFilesDto } from '../../upload/dto/upload-files.dto';
import { PaymentStatusEnum } from '../../../third-party/payment/dto';
import { TicketSubmissionDto } from './ticket-submission.dto';
import { UserDto } from '../../users/dto/user.dto';
import { SourceEnum } from '../../../common/dto/source.enum';

export class OrderDto {
  id: number;
  userId: number;
  orderNo: string;
  groupName: string;
  claimType: string;
  progress: ProgressEnum;
  generatedClaim: string;
  userStatement: string;
  additionalAttachmentIds: number[];
  finalClaim: string;
  answeredClaim: Record<string, any> | Record<string, any>[];
  queryInfo: Record<string, any> | Record<string, any>[];
  paymentStatus: PaymentStatusEnum;
  latestTransactionId: number;
  claimUserId: number;
  resultUserId: number;
  remark: string;
  source: SourceEnum;
  email: string;
  phone: string;
  progressDoneGiftCardId?: number[];
  createdAt: Date;
  updatedAt: Date;
  userCompletedAt: Date;
  processedAt: Date;
  submittedAt: Date;
  receivedAt: Date;
  emailProcessingAt: Date;
  emailSubmittedAt: Date;
  emailCompletedAt: Date;
  user?: UserDto;
  tickets?: TicketDto[];
  ticketSubmissions?: TicketSubmissionDto[];
  additionalAttachments: UploadFilesDto[];
  latestTransaction?: TransactionDto;
  firstStageTransaction?: TransactionDto; // 第一階段服務費最新的成功/失敗
  secondStageTransaction?: TransactionDto; // 第二階段成效金最新的成功/失敗

  constructor(data: Partial<OrderDto>) {
    return plainToInstance(OrderDto, data);
  }

  forView(): this {
    delete this.finalClaim;
    return this;
  }

  // 可用此邏輯判斷罰單是否重複等
  isActive(): boolean {
    return !this.isCompleted();
  }

  isCompleted(): boolean {
    return [
      ProgressEnum.APPROVED,
      ProgressEnum.PARTIAL_APPROVED,
      ProgressEnum.REJECTED,
      ProgressEnum.CANCELED,
    ].includes(this.progress);
  }

  // 含成功 & 部分成功
  isApproved(): boolean {
    return [ProgressEnum.APPROVED, ProgressEnum.PARTIAL_APPROVED].includes(
      this.progress,
    );
  }

  isRejected(): boolean {
    return this.progress === ProgressEnum.REJECTED;
  }

  isFirstStagePaid(): boolean {
    return this.firstStageTransaction?.isSuccessful();
  }

  getFirstStagePaymentStatus(): PaymentStatusEnum {
    return this.firstStageTransaction
      ? this.firstStageTransaction.status
      : PaymentStatusEnum.UNPAID;
  }

  // FIXME 找出二階段未付款的訂單(目前只包含APPROVED)
  isSecondPaymentUnpaid(secondPaymentStartDate: Date): boolean {
    return (
      [ProgressEnum.APPROVED].includes(this.progress) &&
      this.firstStageTransaction?.payAt?.getTime() >
        secondPaymentStartDate.getTime() &&
      this.firstStageTransaction?.isSuccessful() &&
      !this.secondStageTransaction?.isSuccessful()
    );
  }

  // 找出所有罰單中，未繳罰金的最早到期日
  getEarliestExpiresAt(): Date | undefined {
    if (!this.tickets) return;
    return this.tickets
      .filter((t) => !t.isTicketPaid)
      .reduce((earliest, ticket) => {
        return !earliest || ticket.expiresAt < earliest
          ? ticket.expiresAt
          : earliest;
      }, undefined as Date);
  }
}
