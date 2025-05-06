// TODO 是否用的到?
export class AfteeReturnReq {
  id: string; //交易 ID
  shop_transaction_no: string; //商家訂單編號
  authorization_result: number; //信用審查結果 1：通過，2：未通過
}
