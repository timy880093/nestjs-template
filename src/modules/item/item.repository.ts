import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { ItemModel } from './item.model';
import { Item } from './item';

@Injectable()
export class ItemRepository {
  constructor(
    @InjectModel(ItemModel)
    private readonly repository: typeof ItemModel,
  ) {}

  async findOne(dto: Partial<Item>, transaction?: Transaction): Promise<Item> {
    const result = await this.repository.findOne({
      where: { ...dto },
      transaction,
    });
    return result && result.toDto<Item>();
  }

  async findAll(dto?: Partial<Item>, or?: any): Promise<Item[]> {
    let options = {};
    if (dto) options = { ...dto };
    if (or) options[Op.or] = or;

    const results = await this.repository.findAll({
      where: options,
      // order: [['', 'DESC']],
    });
    return ItemModel.toDtoArray<Item>(results);
  }

  async create(dto: Item): Promise<Item> {
    const result = await this.repository.create({ ...dto });
    return result.toDto<Item>();
  }

  async update(
    id: number,
    dto: Partial<Item>,
    transaction?: Transaction,
  ): Promise<Item | undefined> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { id },
        returning: true,
        transaction,
      },
    );
    return results[0] && results[0].toDto<Item>();
  }

  async updateBulk(
    where: Partial<Item>,
    dto: Partial<Item>,
    transaction?: Transaction,
  ): Promise<Item[]> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { ...where },
        returning: true,
        transaction,
      },
    );
    return ItemModel.toDtoArray<Item>(results);
  }
}
