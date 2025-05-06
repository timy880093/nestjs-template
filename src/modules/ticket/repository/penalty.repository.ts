import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { PenaltyModel } from '../entity/penalty.model';
import { PenaltyDto } from '../dto/penalty.dto';

@Injectable()
export class PenaltyRepository {
  constructor(
    @InjectModel(PenaltyModel)
    private readonly repository: typeof PenaltyModel,
  ) {}

  async findOne(
    dto: Partial<PenaltyDto>,
    transaction?: Transaction,
  ): Promise<PenaltyDto> {
    const result = await this.repository.findOne({
      where: { ...dto },
      transaction,
    });
    return result && result.toDto<PenaltyDto>();
  }

  async findAll(dto?: Partial<PenaltyDto>, or?: any): Promise<PenaltyDto[]> {
    let options = {};
    if (dto) options = { ...dto };
    if (or) options[Op.or] = or;

    const results = await this.repository.findAll({
      where: options,
      order: [['article', 'DESC']],
    });
    return PenaltyModel.toDtoArray<PenaltyDto>(results);
  }

  async create(dto: PenaltyDto): Promise<PenaltyDto> {
    const result = await this.repository.create({ ...dto });
    return result.toDto<PenaltyDto>();
  }

  async update(
    id: number,
    dto: Partial<PenaltyDto>,
    transaction?: Transaction,
  ): Promise<PenaltyDto | undefined> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { id },
        returning: true,
        transaction,
      },
    );
    return results[0] && results[0].toDto<PenaltyDto>();
  }

  async updateBulk(
    where: Partial<PenaltyDto>,
    dto: Partial<PenaltyDto>,
    transaction?: Transaction,
  ): Promise<PenaltyDto[]> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { ...where },
        returning: true,
        transaction,
      },
    );
    return PenaltyModel.toDtoArray<PenaltyDto>(results);
  }
}
