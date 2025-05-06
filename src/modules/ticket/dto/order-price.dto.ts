import { PaymentProviderEnum } from '../../../third-party/payment/dto';

export interface OrderFirstPriceDto {
  serviceFee: number;
  additionalFee?: number;
  remark?: string; //計價邏輯說明
}

export interface OrderSecondPriceDto {
  violationFine?: number; //確認過的原始罰金
  appealViolationFine?: number; //申訴後的新罰金
  reducedFine?: number; //減免金額
  penaltyCount?: number; //罰則次數
  amount?: number; //成效金
  percentage: number; //成效金比例
  provider?: PaymentProviderEnum; //支付商
  firstPayAt?: Date; //服務費付款日期
}

export interface TicketFineDto {
  fine?: number; //原始罰金
  appealViolationFine?: number; //申訴後罰金
  remark?: string; //計價邏輯說明
}
