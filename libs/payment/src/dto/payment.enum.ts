export enum PaymentStatusEnum {
  UNPAID = 'unpaid',
  SUCCESSFUL = 'successful', //交易成功
  FAILED = 'failed',
  CANCELED = 'canceled', //交易取消
}

export enum PaymentCategoryEnum {
  SERVICE_FEE = 'service_fee',
  SUCCESS_FEE = 'success_fee',
}

export enum PaymentProviderEnum {
  NEWEBPAY = 'newebpay', //藍新
  AFTEE = 'aftee', //AFTEE 後支付
  // TAPPAY = 'tappay',
}

export enum PaymentMethodEnum {
  CREDIT_CARD = 'credit_card', //信用卡
  TRANSFER = 'transfer', //轉帳
}
