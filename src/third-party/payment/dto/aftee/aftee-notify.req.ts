import { PaymentStatusEnum } from '../payment.enum';

export class AfteeNotifyReq {
  id: string; //交易 ID
  object: string; //object 名稱
  livemode: boolean; //正式模式
  authentication_token: string; //付款認證 token
  aftee_transaction_no: string; //AFTEE 訂單編號
  shop_transaction_no: string; //商家訂單編號
  amount: number; //消費金額
  japanese_yen_amount: number | null; //日幣消費金額
  authorization_result: number; //信用審查結果 1：通過，2：未通過
  authorization_result_ng_reason: number | null; //信用審查結果 NG 理由 若 authorization_result = 2， 本項目值為 1：額度不足，9：其他
  amount_refund_total: number; //退款金額
  registration_datetime: string; //登錄時間
  sales_settled_datetime: string; //交易確認時間
  transaction_options: number[] | null; //交易選項
  related_transaction: string | null; //關聯交易 ID
  updated_transactions: string[] | null; //更新交易 ID
  description: string | null; //商家交易備註
  customer: Customer; //消費者
  tenant: any; //
  dest_customers: DestCustomer[]; //額外指定收件資料
  items: Item[]; //商品明細
  refunds: Refund | null; //取消、退款詳細

  constructor(data: Partial<AfteeNotifyReq>) {
    Object.assign(this, data);
  }

  parseStatus(): PaymentStatusEnum {
    return this.authorization_result?.toString() === '1'
      ? PaymentStatusEnum.SUCCESSFUL
      : PaymentStatusEnum.FAILED;
  }

  parseError(): string | null {
    return (
      this.parseStatus() === PaymentStatusEnum.FAILED &&
      (this.authorization_result_ng_reason?.toString() === '1'
        ? '額度不足'
        : '其他，請洽 AFTEE')
    );
  }
}

interface Customer {
  object: string;
  customer_name: string;
  customer_family_name: string | null;
  customer_given_name: string | null;
  phone_number: string | null;
  birthday: string | null;
  sex_division: string | null;
  company_name: string | null;
  department: string | null;
  zip_code: string | null;
  address: string | null;
  email: string | null;
  total_purchase_count: number | null;
  total_purchase_amount: number | null;
  user_no: string;
  information_code: string | null;
}

interface DestCustomer {
  object: string;
  customer_name: string;
  company_name: string;
  department: string;
  zip_code: string;
  address: string;
  tel: string;
}

interface Item {
  object: string;
  shop_item_id: string;
  item_name: string;
  item_price: number;
  item_count: number;
  item_url: string | null;
}

interface Refund {
  object: string;
  amount_refund: number;
  refund_datetime: string;
  refund_reason: string | null;
  description_refund: string | null;
}
