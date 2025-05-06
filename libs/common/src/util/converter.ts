import { Model } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';

export class Converter {
  static modelToDto<T extends Model, U>(
    model?: T,
    dtoClass?: new () => U,
  ): U | undefined {
    if (!model) return undefined;
    return plainToInstance(dtoClass, model.toJSON(), {
      excludeExtraneousValues: true,
    });
  }
}
