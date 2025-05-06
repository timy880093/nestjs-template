import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import {
  PaymentCategoryEnum,
  PaymentMethodEnum,
  PaymentProviderEnum,
  PaymentStatusEnum,
} from '../../../third-party/payment/dto/payment.enum';
import { OrderModel } from './order.model';
import { CouponModel } from './coupon.model';
import { plainToInstance } from 'class-transformer';
import { TransactionDto } from '../dto/transaction.dto';
import { ItemModel } from '../../item/item.model';
import { GiftCardModel } from '../../gift-card/entity/gift-card.model';

@Table({ tableName: 'transaction' })
export class TransactionModel extends Model<TransactionModel> {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.BIGINT)
  id: number;
  @ForeignKey(() => OrderModel)
  @Column(DataType.BIGINT)
  orderId: number;
  @Unique
  @Column
  tradeNo: string;
  @Column
  providerTradeNo: string;
  @Column
  token: string;
  @Column(DataType.TEXT)
  status: PaymentStatusEnum;
  @Column(DataType.TEXT)
  category: PaymentCategoryEnum;
  @Column
  product: string;
  @ForeignKey(() => ItemModel)
  @Column
  itemId: number;
  @ForeignKey(() => CouponModel)
  @Column
  couponId: number;
  @ForeignKey(() => GiftCardModel)
  @Column
  giftCardId: number;
  @Column
  serviceFee: number;
  @Column
  additionalFee: number;
  @Column
  totalAmount: number;
  @Column
  username: string;
  @Column
  userUuid: string;
  @Column
  email: string;
  @Column
  phone: string;
  @Column
  error: string;
  @Column
  isPriority: boolean;
  @Column(DataType.TEXT)
  paymentProvider: PaymentProviderEnum;
  @Column(DataType.TEXT)
  paymentMethod: PaymentMethodEnum;
  @Column
  action: string;
  @Column
  payAt: Date;
  @Column
  invoiceNo: string;
  @Column
  invoiceRandomNo: string;
  @Column
  remark: string;
  @Column
  invoiceAt: Date;
  @Column
  createdAt: Date;
  @Column
  updatedAt: Date;

  @BelongsTo(() => ItemModel)
  itemModel: ItemModel;

  @BelongsTo(() => OrderModel)
  orderModel: OrderModel;

  @BelongsTo(() => GiftCardModel)
  giftCardModel: GiftCardModel;

  static toDto(model: TransactionModel): TransactionDto {
    if (!model) return null;
    const transaction: TransactionDto = plainToInstance(
      TransactionDto,
      model.toJSON(),
    );
    transaction.id = model.id ? Number(model.id) : null;
    transaction.orderId = model.orderId ? Number(model.orderId) : null;
    transaction.item = ItemModel.toDto(model.itemModel);
    transaction.order = OrderModel.toDto(model.orderModel);
    transaction.giftCard = model.giftCardModel;
    return transaction;
  }
}
