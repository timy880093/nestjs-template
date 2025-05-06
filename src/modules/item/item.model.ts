import {
  AutoIncrement,
  Column,
  DataType,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { BaseModel } from '../../common/dto/base.model';

import { ItemCategoryEnum, ItemNameEnum } from './item.enum';
import { Item } from './item';

@Table({ tableName: 'item' })
export class ItemModel extends BaseModel {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column
  id: number;
  @Column(DataType.TEXT)
  category: ItemCategoryEnum;
  @Column(DataType.TEXT)
  name: ItemNameEnum;
  @Column
  description: string;
  @Column
  amount: number;
  @Column
  count?: number;
  @Column
  originalPrice?: number;
  @Column
  imageUrl?: number;

  static toDto(model: ItemModel): Item {
    if (!model) return null;
    return plainToInstance(Item, model.toJSON());
  }
}
