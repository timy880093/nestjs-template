import { CouponTypeEnum } from '../../ticket/enums/coupon-type.enum';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGiftCardReq {
  @IsNumber()
  count: number; // 數量
  @IsNumber()
  value: number; // 金額
  @IsEnum(CouponTypeEnum)
  type: CouponTypeEnum; // 類型
  @IsDateString()
  expiredAt: Date; // 到期日
  @IsOptional()
  @IsString()
  ref?: string; // 分潤來源
}

export interface CreateGiftCardRes {
  count: number; // 數量
  codes: string[]; // 禮品卡序號
}
