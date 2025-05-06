import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GiftCardStatusEnum } from '../dto/gift-card-status.enum';
import { NewTransactionModel } from 'src/modules/new-transaction/new-transaction.model';
import { GiftCardOrderDetailModel } from './gift-card-order-detail.model';

@Table({
  tableName: 'gift_card_order',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: false, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class GiftCardOrderModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => NewTransactionModel)
  @Column(DataType.INTEGER)
  transactionId: number;

  @Column tradeNo: string;
  @Column userName: string;
  @Column email: string;
  @Column(DataType.TEXT)
  status: GiftCardStatusEnum;
  @Column amount: number;
  @Column createdAt: Date;
  @Column(DataType.TEXT)
  ref: string;

  @HasMany(() => GiftCardOrderDetailModel)
  orderDetails?: GiftCardOrderDetailModel[];
}
