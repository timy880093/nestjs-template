import { CouponDto } from './coupon.dto';
import { CouponTypeEnum } from '../enums/coupon-type.enum';

describe('CouponDto', () => {
  it('should calculate discount amount for FIXED type', () => {
    const coupon = new CouponDto({
      type: CouponTypeEnum.FIXED,
      discount: 10,
    });

    const price = 100;
    const discountAmount = coupon.calculateDiscountAmount(price);
    expect(discountAmount).toBe(10);
  });

  it('should calculate discount amount for PERCENTAGE type round half up', () => {
    const coupon = new CouponDto({
      type: CouponTypeEnum.PERCENTAGE,
      discount: 10,
    });

    const price = 149;
    const discountAmount = coupon.calculateDiscountAmount(price);
    expect(discountAmount).toBe(15);
  });

  it('should calculate discount amount for PERCENTAGE type round half down', () => {
    const coupon = new CouponDto({
      type: CouponTypeEnum.PERCENTAGE,
      discount: 60,
    });

    const price = 149;
    const discountAmount = coupon.calculateDiscountAmount(price);
    expect(discountAmount).toBe(89);
  });

  it('should return 0 for unknown coupon type', () => {
    const coupon = new CouponDto({
      type: 'UNKNOWN' as CouponTypeEnum,
      discount: 10,
    });

    const price = 100;
    const discountAmount = coupon.calculateDiscountAmount(price);
    expect(discountAmount).toBe(0);
  });
});
