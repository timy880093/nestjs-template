export enum ErrorTypes {
  // ticket
  TICKET_NO_DUPLICATED = 'TICKET_NO_DUPLICATED', //罰單編號重複
  // payment
  FIRST_PAYMENT_PAID = 'FIRST_PAYMENT_PAID', //一階段已付款 無法重複付款
  OTHERS_SECOND_PAYMENT_UNPAID = 'OTHERS_SECOND_PAYMENT_UNPAID', //有其他二階段未付款 無法為新訂單付款
  ALREADY_RECEIVED_PAYMENT = 'ALREADY_RECEIVED_PAYMENT', //已經收到付款通知
  // coupon
  COUPON_ALREADY_USED = 'COUPON_ALREADY_USED', //coupon 已使用
  COUPON_NO_QUOTA = 'COUPON_NO_QUOTA', //coupon無額度
  COUPON_LIMIT_EXCEEDED = 'COUPON_LIMIT_EXCEEDED', //coupon使用超過限額
  COUPON_EXPIRED = 'COUPON_EXPIRED', //過期
  COUPON_NOT_ACTIVE = 'COUPON_NOT_ACTIVE', //未啟用
  // gift-card
  GIFT_CARD_ALREADY_USED = 'GIFT_CARD_ALREADY_USED', //gift-card 不存在
  GIFT_CARD_EXPIRED = 'GIFT_CARD_EXPIRED', //gift-card 不存在
  // mvdis
  MVDIS_UID_OR_BIRTH_NOT_FOUND = 'MVDIS_UID_OR_BIRTH_NOT_FOUND', //監理站查詢 身分證或出生年月不正確
  MVDIS_RETRY_ERROR = 'MVDIS_RETRY_ERROR', //監理站查詢 查詢多次仍然失敗
  // others
  INVALID = 'INVALID', //格式無效 or 預設錯誤
  DUPLICATED = 'DUPLICATED', //格式無效 or 預設錯誤
  NOT_FOUND = 'NOT_FOUND', //找不到
  EXPIRED = 'EXPIRED', //過期
  INVOICE_ERROR = 'INVOICE_ERROR', //發票錯誤
  UNAUTHORIZED = 'UNAUTHORIZED', //無存取權限
  SERVER_ERROR = 'SERVER_ERROR', //異常錯誤
}

export const ErrorTypeToHttpCode: { [key in ErrorTypes]: number } = {
  [ErrorTypes.TICKET_NO_DUPLICATED]: 400,
  [ErrorTypes.FIRST_PAYMENT_PAID]: 400,
  [ErrorTypes.OTHERS_SECOND_PAYMENT_UNPAID]: 400,
  [ErrorTypes.ALREADY_RECEIVED_PAYMENT]: 400,
  [ErrorTypes.COUPON_ALREADY_USED]: 400,
  [ErrorTypes.COUPON_NO_QUOTA]: 400,
  [ErrorTypes.COUPON_LIMIT_EXCEEDED]: 400,
  [ErrorTypes.COUPON_EXPIRED]: 400,
  [ErrorTypes.COUPON_NOT_ACTIVE]: 400,
  [ErrorTypes.GIFT_CARD_ALREADY_USED]: 400,
  [ErrorTypes.GIFT_CARD_EXPIRED]: 400,
  [ErrorTypes.MVDIS_UID_OR_BIRTH_NOT_FOUND]: 404,
  [ErrorTypes.MVDIS_RETRY_ERROR]: 500,
  [ErrorTypes.INVALID]: 400,
  [ErrorTypes.DUPLICATED]: 409,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.EXPIRED]: 410,
  [ErrorTypes.INVOICE_ERROR]: 400,
  [ErrorTypes.UNAUTHORIZED]: 403,
  [ErrorTypes.SERVER_ERROR]: 500,
};
