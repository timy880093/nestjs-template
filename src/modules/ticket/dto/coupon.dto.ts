import { CouponTypeEnum } from '../enums/coupon-type.enum';
import { plainToInstance } from 'class-transformer';

export class CouponDto {
  id: number;
  type: CouponTypeEnum;
  code: string;
  description: string;
  discount: number;
  totalCount: number;
  usageCount: number;
  limitPerUser: number;
  isActive: boolean;
  isTest: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(dto: Partial<CouponDto>) {
    return plainToInstance(CouponDto, dto);
  }

  calculateDiscountAmount(price: number): number {
    switch (this.type) {
      case CouponTypeEnum.FIXED:
        return this.discount;
      case CouponTypeEnum.PERCENTAGE:
        return Math.round(price * (this.discount / 100));
      default:
        return 0;
    }
  }

  calculateDiscountAdditionalFee(price: number): number {
    return this.type === CouponTypeEnum.PERCENTAGE && this.discount === 100
      ? price
      : null;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isNoQuota(): boolean {
    return this.totalCount > 0 && this.usageCount >= this.totalCount;
  }

  isOverLimitPerUser(usedCount: number): boolean {
    return this.limitPerUser > 0 && usedCount >= this.limitPerUser;
  }

  isAvailable(): boolean {
    return this.isActive && this.isExpired() && this.isNoQuota();
  }
}
