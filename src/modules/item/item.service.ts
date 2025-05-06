import { Injectable } from '@nestjs/common';
import { ItemNameEnum } from './item.enum';
import { ItemRepository } from './item.repository';
import { Item } from './item';

@Injectable()
export class ItemService {
  constructor(private readonly itemRepository: ItemRepository) {}

  // 第一階段服務費
  async getServiceFeeItem(): Promise<Item> {
    return this.itemRepository.findOne({
      name: ItemNameEnum.SERVICE_FEE,
    });
  }

  async getAdditionalFeeItem(): Promise<Item> {
    return this.itemRepository.findOne({
      name: ItemNameEnum.ADDITIONAL_FEE,
    });
  }

  async getFreeItem(): Promise<Item> {
    return this.itemRepository.findOne({
      name: ItemNameEnum.FREE,
    });
  }

  // 第二階段成效金(成功加收費)
  async getSuccessFeeItem(): Promise<Item> {
    return this.itemRepository.findOne({
      name: ItemNameEnum.SUCCESS_FEE,
    });
  }

  // 第二階段成效金(沒有罰金的費用)
  async getPenaltySuccessFeeItem(): Promise<Item> {
    return this.itemRepository.findOne({
      name: ItemNameEnum.PENALTY_SUCCESS_FEE,
    });
  }
}
