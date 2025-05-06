import { PaymentRes } from '../dto/payment.res';
import { PaymentMethodEnum, PaymentStatusEnum } from '../dto/payment.enum';
import { NewebpayNotifyRes } from '../dto/newebpay/newebpay-notify.res';

export class NewebpayBuilder {
  static isNewebpayResult(data: any) {
    return data.TradeInfo && data.TradeSha;
  }

  static toPaymentRes(dto: NewebpayNotifyRes): PaymentRes {
    const { PaymentType, TradeNo, MerchantOrderNo, PayTime } = dto.Result;
    let paymentMethod: PaymentMethodEnum;
    switch (PaymentType) {
      case 'CREDIT':
        paymentMethod = PaymentMethodEnum.CREDIT_CARD;
        break;
      case 'WEBATM': // 網路 ATM 轉帳付款
      case 'VACC': // 銀行 ATM 轉帳付款
        paymentMethod = PaymentMethodEnum.TRANSFER;
        break;
    }
    const payAt = new Date();
    // if (PayTime) {
    //   const payTime =
    //     PayTime[10] === ' '
    //       ? PayTime
    //       : PayTime.slice(0, 10) + ' ' + PayTime.slice(10);
    //   payAt = DateUtil.twDayjs(payTime).toDate();
    // }

    return new PaymentRes({
      status:
        dto.Status === 'SUCCESS' && MerchantOrderNo
          ? PaymentStatusEnum.SUCCESSFUL
          : PaymentStatusEnum.FAILED,
      tradeNo: MerchantOrderNo || '',
      providerTradeNo: TradeNo || '',
      error: dto.Status !== 'SUCCESS' && dto.Message,
      paymentMethod,
      payAt,
    });
  }
}
