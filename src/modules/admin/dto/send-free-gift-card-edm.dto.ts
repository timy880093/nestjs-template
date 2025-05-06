import { CouponTypeEnum } from '../../ticket/enums/coupon-type.enum';
import { IsArray, IsEnum, IsNumber, IsString, Matches } from 'class-validator';

export class SendFreeGiftCardEdmDto {
  @IsString()
  subject: string;
  @Matches(/^(gift-card-edm-for-free|gift-card-edm-for-shareholder)$/, {
    message: 'template error',
  })
  template: string;
  @IsArray()
  to: string[];
  @Matches(/^\d+([dmy])$/)
  expires: string;

  @IsNumber()
  value: number;
  @IsEnum(CouponTypeEnum)
  type: CouponTypeEnum;
  @IsNumber()
  count: number;
}
