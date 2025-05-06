import { plainToInstance } from 'class-transformer';

export class CouponDiscountDto {
  id: number;
  type: CouponDiscountTypeEnum;
  description: string;
  discount: number;
  discountAdditionalFee: number;

  constructor(dto: Partial<CouponDiscountDto>) {
    return plainToInstance(CouponDiscountDto, dto);
  }

  static noCoupon(message: string) {
    return new CouponDiscountDto({
      id: null,
      description: message,
      discount: 0,
    });
  }
}

export enum CouponDiscountTypeEnum {
  COUPON = 'coupon',
  GIFT_CARD = 'gift_card',
}
