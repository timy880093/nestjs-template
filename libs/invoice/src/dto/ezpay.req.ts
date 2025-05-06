import { plainToInstance } from 'class-transformer';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class EzpayReq {
  RespondType: string; // 回傳格式
  Version: string; // 串接程式版本
  Status: string; // 開立發票方式
  // CreateStatusTime?: string; // 開立日期
  TaxType: string; // 課稅別
  TaxRate: number; // 稅率
  ItemCount: number; // 商品數量
  ItemUnit: string; // 商品單位
  Comment: string;
  Category: string;
  PrintFlag: string;
  @IsString()
  BuyerName: string;
  @IsEmail()
  BuyerEmail: string; // 買受人電子信箱
  TimeStamp: string; // 時間戳記
  MerchantOrderNo: string; // 金流訂單編號
  Amt: number; // 金額
  TaxAmt: number; // 稅額
  @IsNumber()
  TotalAmt: number; // 發票金額
  ItemName: string; // 商品名稱
  ItemPrice: number; // 商品單價
  ItemAmt: number; // 商品小計
  BuyerUBN?: string; // 買方統編
  LoveCode?: string; // 捐贈碼
  CarrierType?: string; // 載具類型
  CarrierNum?: string; // 載具號碼

  constructor(data: Partial<EzpayReq>) {
    return plainToInstance(EzpayReq, data);
  }

  calculate(): this {
    if (!this.TotalAmt || !this.TaxRate) return this;

    this.TaxAmt = Math.round(
      (this.TotalAmt * this.TaxRate) / 100 / (1 + this.TaxRate / 100),
    );
    this.Amt = this.TotalAmt - this.TaxAmt;
    this.ItemPrice = this.TotalAmt;
    this.ItemAmt = this.TotalAmt;
    return this;
  }

  static build(): EzpayReq {
    return new EzpayReq({
      RespondType: 'JSON',
      Version: '1.5',
      Status: '1',
      TaxType: '1',
      TaxRate: 5,
      ItemCount: 1,
      ItemUnit: '份',
      Comment: '',
      TimeStamp: Math.round(Date.now() / 1000).toString(),
    });
  }

  static buildB2C(
    carrierType?: string,
    carrierNum?: string,
    loveCode?: string,
  ): Partial<EzpayReq> {
    return {
      ...EzpayReq.build(),
      Category: 'B2C',
      PrintFlag: 'N',
      CarrierType: !loveCode ? carrierType : undefined,
      CarrierNum: !loveCode ? carrierNum : undefined,
      LoveCode: !carrierType ? loveCode : undefined,
    };
  }

  static buildB2CEmail(email: string): Partial<EzpayReq> {
    return {
      ...EzpayReq.buildB2C('2', email, null),
      BuyerEmail: email,
    };
  }

  static builedB2B(ubn: string): Partial<EzpayReq> {
    return {
      ...EzpayReq.build(),
      Category: 'B2B',
      PrintFlag: 'Y',
      BuyerUBN: ubn,
    };
  }
}
