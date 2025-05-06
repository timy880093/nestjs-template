import { Model, ModelCtor } from 'sequelize-typescript';
import { CreationAttributes, Transaction, WhereOptions } from 'sequelize';
import { Includeable } from 'sequelize/types/model';

// 返回 model 的版本
export abstract class GenericRepository<M extends Model> {
  protected constructor(private readonly modelClass: ModelCtor<M>) {}

  async findOne(
    where: WhereOptions<M>,
    include?: Includeable[],
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<M> {
    return this.modelClass.findOne({
      where,
      include,
      order: sort,
      transaction,
    });
  }

  async findAll(
    where: WhereOptions<M>,
    include?: Includeable[],
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<M[]> {
    return this.modelClass.findAll({
      where,
      include,
      order: sort,
      transaction,
    });
  }

  async create(
    data: CreationAttributes<M>,
    transaction?: Transaction,
  ): Promise<M> {
    return this.modelClass.create(data, { transaction });
  }

  async bulkCreate(
    data: CreationAttributes<M>[],
    transaction?: Transaction,
  ): Promise<M[]> {
    return this.modelClass.bulkCreate(data, { transaction });
  }

  async update(
    data: Partial<M>,
    where: WhereOptions<M>,
    returning?: boolean,
    transaction?: Transaction,
  ): Promise<M> {
    const results = await this.bulkUpdate(data, where, returning, transaction);
    return results?.[0];
  }

  async bulkUpdate(
    data: Partial<M>,
    where: WhereOptions<M>,
    returning?: boolean,
    transaction?: Transaction,
  ): Promise<M[]> {
    if (!returning) {
      await this.modelClass.update(data, { where, transaction });
      return;
    }
    const [_, results] = await this.modelClass.update(data, {
      where,
      returning: true,
      transaction,
    });
    return results;
  }

  async upsert(
    values: CreationAttributes<M>, //要包含主键
    transaction?: Transaction,
  ): Promise<[M, boolean]> {
    const [instance, created] = await this.modelClass.upsert(values, {
      returning: true,
      transaction,
    });
    return [instance, created];
  }

  async delete(
    where: WhereOptions<M>,
    transaction?: Transaction,
  ): Promise<number> {
    return this.modelClass.destroy({ where, transaction });
  }

  async restore(
    where: WhereOptions<M>,
    transaction?: Transaction,
  ): Promise<number> {
    const number = await this.count(where, transaction);
    await this.modelClass.restore({ where, transaction });
    return number;
  }

  async count(
    where: WhereOptions<M>,
    transaction?: Transaction,
  ): Promise<number> {
    return this.modelClass.count({ where, transaction });
  }
}
