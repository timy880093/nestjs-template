import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { CouponDto } from '../dto/coupon.dto';
import { plainToInstance } from 'class-transformer';
import { CouponTypeEnum } from '../enums/coupon-type.enum';

@Table({ tableName: 'coupon' })
export class CouponModel extends Model<CouponModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column(DataType.TEXT)
  type: CouponTypeEnum;

  @Unique
  @Column
  code: string;

  @Column
  description: string;

  @Column
  discount: number;

  @Column
  totalCount: number;

  @Column
  usageCount: number;

  @Column
  limitPerUser: number;

  @Column
  isActive: boolean;

  @Column
  isTest: boolean;

  @Column
  expiresAt: Date;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;

  static toDto(model?: CouponModel): CouponDto {
    if (!model) return null;
    return plainToInstance(CouponDto, model.toJSON());
  }
}
