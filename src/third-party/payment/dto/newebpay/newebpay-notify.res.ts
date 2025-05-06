// sample/newebpay-notify-response.json
export class NewebpayNotifyRes {
  Status: string;
  Message: string;
  Result: NewebpayNotifyResult;

  constructor(dto: Partial<NewebpayNotifyRes>) {
    Object.assign(this, dto);
  }
}

export interface NewebpayNotifyResult {
  TradeNo: string; // 藍新交易序號
  MerchantOrderNo: string; // 商店訂單編號
  PaymentType: string; // 付款方式
  PayTime: string; // TW time
  Amt: number;

  // "MerchantID": "MS352623562",
  // "Amt": 178,
  // "TradeNo": "24102414465540620",
  // "MerchantOrderNo": "TA20241024e28f1cfdxx",
  // "RespondType": "JSON",
  // "IP": "xxx.xxx.xxx.xxx",
  // "EscrowBank": "HNCB",
  // "PaymentType": "CREDIT",
  // "RespondCode": "00",
  // "Auth": "075433",
  // "Card6No": "400022",
  // "Card4No": "1111",
  // "Exp": "2607",
  // "AuthBank": "KGI",
  // "TokenUseStatus": 0,
  // "InstFirst": 0,
  // "InstEach": 0,
  // "Inst": 0,
  // "ECI": "",
  // "PayTime": "2024-10-2414:46:56",
  // "PaymentMethod": "CREDIT" // CREDIT: 信用卡,
}

// PaymentType
// CREDIT=信用卡付款
// VACC=銀行 ATM 轉帳付款
// WEBATM=網路銀行轉帳付款
// BARCODE=超商條碼繳費
// CVS=超商代碼繳費
// LINEPAY=LINE Pay 付款
// ESUNWALLET=玉山 Wallet
// TAIWANPAY=台灣 Pay
// CVSCOM = 超商取貨付款
// FULA=Fula 付啦

// PaymentMethod
// CREDIT = 台灣發卡機構核發之信用卡
// FOREIGN = 國外發卡機構核發之卡
// NTCB = 國民旅遊卡
// UNIONPAY = 銀聯卡
// APPLEPAY = ApplePay
// GOOGLEPAY = GooglePay
// SAMSUNGPAY = SamsungPay
