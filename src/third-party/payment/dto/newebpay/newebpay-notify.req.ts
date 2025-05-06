import { plainToInstance } from 'class-transformer';

// sample/newebpay-notify-request.json
export class NewebpayNotifyReq {
  Status: string;
  MerchantID: string;
  Version: string;
  TradeInfo: string;
  TradeSha: string;

  constructor(data: Partial<NewebpayNotifyReq>) {
    return plainToInstance(NewebpayNotifyReq, data);
  }
}
