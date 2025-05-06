import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GiftCardOrderModel } from './gift-card-order.model';
import { ItemModel } from 'src/modules/item/item.model';
import { GiftCardModel } from './gift-card.model';

@Table({
  tableName: 'gift_card_order_detail',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: false, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class GiftCardOrderDetailModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => GiftCardOrderModel)
  @Column(DataType.INTEGER)
  orderId: number;

  @ForeignKey(() => ItemModel)
  @Column(DataType.INTEGER)
  itemId: number;

  @Column count: number;

  @HasMany(() => GiftCardModel)
  giftCards?: GiftCardModel[];

  @BelongsTo(() => ItemModel)
  item?: ItemModel;
}
