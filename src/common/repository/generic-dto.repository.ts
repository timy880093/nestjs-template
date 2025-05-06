import { Model, ModelCtor } from 'sequelize-typescript';
import { CreationAttributes, Transaction, WhereOptions } from 'sequelize';
import { Includeable } from 'sequelize/types/model';

// 返回 dto 泛型的版本
export abstract class GenericDtoRepository<M extends Model<M>, D> {
  protected constructor(
    private readonly modelClass: ModelCtor<M>,
    private readonly dtoClass: new (model: M) => D,
  ) {}

  toDto(model: M): D {
    return new this.dtoClass(model.toJSON());
  }

  async findOne(
    where: WhereOptions<M>,
    include?: Includeable[],
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<D | undefined> {
    const result = await this.modelClass.findOne({
      where,
      include,
      order: sort,
      transaction,
    });
    // return plainToInstance(dtoClass, entity.get() as D);
    return this.toDto(result);
  }

  async findAll(
    where: WhereOptions<M>,
    // dtoClass: new () => D,
    include?: Includeable[],
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<D[]> {
    const results = await this.modelClass.findAll({
      where,
      include,
      order: sort,
      transaction,
    });
    return results.map((result) => this.toDto(result));
  }

  async create(
    data: CreationAttributes<M>,
    transaction?: Transaction,
  ): Promise<D> {
    const result = await this.modelClass.create(data, { transaction });
    return this.toDto(result);
  }

  async bulkCreate(
    data: CreationAttributes<M>[],
    transaction?: Transaction,
  ): Promise<D[]> {
    const results = await this.modelClass.bulkCreate(data, { transaction });
    return results.map((result) => this.toDto(result));
  }

  async update(
    data: Partial<M>,
    where: WhereOptions<M>,
    returning?: boolean,
    transaction?: Transaction,
  ): Promise<D | undefined> {
    const results = await this.bulkUpdate(data, where, returning, transaction);
    return results?.[0];
  }

  async bulkUpdate(
    data: Partial<M>,
    where: WhereOptions<M>,
    returning?: boolean,
    transaction?: Transaction,
  ): Promise<D[] | undefined> {
    if (!returning) {
      await this.modelClass.update(data, { where, transaction });
      return;
    }
    const [_, results] = await this.modelClass.update(data, {
      where,
      returning: true,
      transaction,
    });
    return results.map((result) => this.toDto(result));
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
