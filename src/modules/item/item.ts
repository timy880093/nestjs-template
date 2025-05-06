import { ItemCategoryEnum, ItemNameEnum } from './item.enum';

export class Item {
  id: number;
  category: ItemCategoryEnum;
  name: ItemNameEnum;
  description: string;
  amount: number;
  count: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(data: Partial<Item>) {
    Object.assign(this, data);
  }
}
