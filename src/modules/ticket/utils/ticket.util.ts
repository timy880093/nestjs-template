import { TicketDto } from '../dto/ticket.dto';
import { CommonUtil } from '../../../common/util/common.util';
import _ from 'lodash';
import { DateUtil } from '../../../common/util/date.util';
import { PaymentCategoryEnum } from '../../../third-party/payment/dto/payment.enum';
import { v4 as uuidv4 } from 'uuid';

export class TicketUtil {
  static calculateRemainingDays(
    tickets: Partial<TicketDto>[],
    date: Date,
  ): number {
    const unpaidTickets = tickets?.filter(
      (ticket: TicketDto) => !ticket.isTicketPaid,
    );
    const min = _.minBy(unpaidTickets, (ticket: TicketDto) => ticket.expiresAt);
    return min ? DateUtil.diffTaipei(min.expiresAt, date, 'd') : null;
  }

  static calculateAdditionalFee(
    tickets: Partial<TicketDto>[],
    urgentDays: number,
    additionalFee: number,
    date?: Date,
  ): number {
    if (!CommonUtil.isArray(tickets)) return null;
    if (!date) date = DateUtil.twDayjs()?.toDate();
    const remainingDays = this.calculateRemainingDays(tickets, date);
    return _.isNumber(remainingDays) &&
      remainingDays <= urgentDays &&
      remainingDays > 0
      ? additionalFee
      : null;
  }

  static async calculateTicketsPrice(
    tickets: Partial<TicketDto>[],
    date: Date,
    serviceFee: number,
    additionalFee?: number,
    urgentDays?: number,
  ): Promise<number> {
    return this.calculateAdditionalFee(
      tickets,
      urgentDays,
      additionalFee,
      date,
    );
  }

  static calculateProfit(amount: number, profitRate: number): number {
    const num = amount * profitRate;
    return num - (num % 10) + 9;
  }

  static calculateServiceFee(fine: number): number {
    // 趨緩非線性函數計算 再做四捨五入
    // const num = Math.round(2.2224 * Math.pow(fine, 0.5779));
    const num = 39.867 * Math.log(fine) - 166.12;
    // 個位數轉成 9
    return num - (num % 10) + 9;
  }

  // 根據付款時間 計算成效金比例
  static calculateSuccessFeeRate(
    payAt: Date,
    successFeeRate: number,
    secondPaymentStartDate: Date,
    successFeeRate2: number,
    secondPaymentStartDate2: Date,
  ): number {
    if (payAt < secondPaymentStartDate) return;
    if (payAt < secondPaymentStartDate2) return successFeeRate;
    return successFeeRate2;
  }

  static calculateSuccessFee(
    fine: number,
    rate: number,
    penaltyCount: number,
    successFeePerPenalty: number,
  ): number {
    const successFee = (fine || 0) * rate;
    const successFee2 = (penaltyCount || 0) * successFeePerPenalty;
    return successFee + successFee2;
  }

  static genTradeNo(orderNo: string, category: PaymentCategoryEnum): string {
    const categoryNumber = category === PaymentCategoryEnum.SERVICE_FEE ? 1 : 2;
    return `${orderNo}${uuidv4().slice(0, 4)}${categoryNumber}`;
  }

  static genGiftCardTradeNo(): string {
    return `GC${uuidv4().slice(0, 12)}`;
  }
}
