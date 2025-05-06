import { plainToInstance } from 'class-transformer';

export class NewebpayReq {
  Url: string;
  MerchantID: string;
  Version: string;
  TradeInfo: string;
  TradeSha: string;

  constructor(data: Partial<NewebpayReq>) {
    return plainToInstance(NewebpayReq, data);
  }
}
