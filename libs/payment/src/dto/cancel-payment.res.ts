import { ApiStatusEnum } from '@app/common/dto/api-status.enum';

export class CancelPaymentRes {
  apiStatus: ApiStatusEnum;
  canceledAt: Date;
  refundAmount: number;
  error?: string;

  constructor(dto: Partial<CancelPaymentRes>) {
    Object.assign(this, dto);
  }

  isSuccessful(): boolean {
    return this.apiStatus === ApiStatusEnum.SUCCESSFUL;
  }
}
