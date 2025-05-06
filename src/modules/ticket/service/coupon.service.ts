import { Injectable } from '@nestjs/common';
import { CouponRepository } from '../repository/coupon.repository';
import { CouponDto } from '../dto/coupon.dto';
import { Transaction } from 'sequelize';
import { CouponModel } from '../entity/coupon.model';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async findOneBy(
    where: Partial<CouponDto>,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    return this.couponRepository.findOneBy(where, transaction);
  }

  async findOneLikeCode(
    code: string,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    return this.couponRepository.findOneLikeCode(code, transaction);
  }

  async create(dto: CouponDto): Promise<CouponModel> {
    return this.couponRepository.create(dto);
  }

  async update(
    id: number,
    dto: Partial<CouponDto>,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    return this.couponRepository.update(id, dto, transaction);
  }
}
