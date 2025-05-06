import { Expose } from 'class-transformer';

export class AfteePreRegisterRes {
  @Expose({ name: 'pre_register' })
  preRegister: boolean; // 註冊狀態，true 為註冊成功
  @Expose({ name: 'shop_transaction_no' })
  shopTransactionNo: string; // 商家設定之訂單編號
  @Expose({ name: 'pre_register_identifier' })
  preRegisterIdentifier: string; // AFTEE 指定之 identifier

  isSuccessful(): boolean {
    return this.preRegister === true;
  }
}
