import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GiftCardOrderDetailModel } from './gift-card-order-detail.model';
import { CouponTypeEnum } from '../../ticket/enums/coupon-type.enum';

@Table({
  tableName: 'gift_card',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: false, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class GiftCardModel extends Model<GiftCardModel> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @ForeignKey(() => GiftCardOrderDetailModel)
  @Column(DataType.INTEGER)
  orderDetailId?: number;
  @Column({
    unique: true,
  })
  code: string;
  @Column value: number;
  @Column(DataType.TEXT)
  type: CouponTypeEnum;
  @Column expiredAt: Date;
  @Column usedAt: Date;
  @Column(DataType.TEXT)
  ref: string;

  @BelongsTo(() => GiftCardOrderDetailModel)
  orderDetails: GiftCardOrderDetailModel;
}
