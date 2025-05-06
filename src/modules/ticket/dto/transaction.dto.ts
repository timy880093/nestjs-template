import {
  PaymentCategoryEnum,
  PaymentMethodEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '../../../third-party/payment/dto/payment.enum';
import { Item } from '../../item/item';
import { OrderDto } from './order.dto';
import { GiftCardModel } from '../../gift-card/entity/gift-card.model';

export class TransactionDto {
  id: number;
  orderId: number;
  tradeNo: string;
  providerTradeNo: string; //金流服務商交易 id
  token: string; //金流服務商交易 token
  status: PaymentStatusEnum;
  category: PaymentCategoryEnum;
  product: string;
  itemId: number;
  couponId: number;
  giftCardId: number;
  serviceFee: number;
  additionalFee: number;
  totalAmount: number;
  username: string;
  userUuid: string;
  email: string;
  phone: string;
  error: string;
  isPriority: boolean;
  paymentProvider: PaymentProviderEnum;
  paymentMethod: PaymentMethodEnum;
  payAt: Date;
  action: string;
  invoiceNo: string;
  invoiceRandomNo: string;
  remark: string;
  invoiceAt: Date;
  createdAt: Date;
  updatedAt: Date;
  item: Item;
  order: OrderDto;
  giftCard: GiftCardModel;

  hasReceived(): boolean {
    return [PaymentStatusEnum.SUCCESSFUL, PaymentStatusEnum.FAILED].includes(
      this.status,
    );
  }

  isSuccessful(): boolean {
    return this.status === PaymentStatusEnum.SUCCESSFUL;
  }

  isUnpaid(): boolean {
    return !this.isSuccessful();
  }

  isFailed(): boolean {
    return this.status === PaymentStatusEnum.FAILED;
  }

  isFirstStage() {
    return this.category === PaymentCategoryEnum.SERVICE_FEE;
  }

  isSecondStage() {
    return this.category === PaymentCategoryEnum.SUCCESS_FEE;
  }

  constructor(data: Partial<TransactionDto>) {
    Object.assign(this, data);
  }
}
