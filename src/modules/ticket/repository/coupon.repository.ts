import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CouponModel } from '../entity/coupon.model';
import { CouponDto } from '../dto/coupon.dto';
import { Op, Transaction } from 'sequelize';

@Injectable()
export class CouponRepository {
  constructor(
    @InjectModel(CouponModel)
    private readonly repository: typeof CouponModel,
  ) {}

  async findOneBy(
    where: Partial<CouponDto>,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    const result = await this.repository.findOne({
      where: { ...where },
      transaction,
    });
    return CouponModel.toDto(result);
  }

  // couponCode 大小寫相容
  async findOneLikeCode(
    code: string,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    const result = await this.repository.findOne({
      where: {
        code: { [Op.iLike]: code },
      },
      transaction,
    });
    return CouponModel.toDto(result);
  }

  async create(dto: CouponDto): Promise<CouponModel> {
    return this.repository.create({ ...dto });
  }

  async update(
    id: number,
    dto: Partial<CouponDto>,
    transaction?: Transaction,
  ): Promise<CouponDto> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { id },
        returning: true,
        transaction,
      },
    );
    return CouponModel.toDto(results[0]);
  }
}
