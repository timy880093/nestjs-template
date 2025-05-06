import { InjectModel } from '@nestjs/sequelize';
import { GiftCardModel } from './entity/gift-card.model';
import { GiftCardOrderModel } from './entity/gift-card-order.model';
import { GiftCardOrderDetailModel } from './entity/gift-card-order-detail.model';

import { GiftCardStatusEnum } from './dto/gift-card-status.enum';
import { ItemModel } from 'src/modules/item/item.model';

import { createRandomString } from 'src/common/util/create-random-string.util';
import { createRandomCode } from 'src/common/util/create-random-code.util';
import { GiftCardOrderDto } from './dto/gift-card-order.dto';
import { Item } from '../item/item';
import { Transaction, WhereOptions } from 'sequelize';

export class GiftCardRepository {
  constructor(
    @InjectModel(GiftCardModel)
    private readonly giftCardModel: typeof GiftCardModel,
    @InjectModel(GiftCardOrderModel)
    private readonly giftCardOrderModel: typeof GiftCardOrderModel,
    @InjectModel(GiftCardOrderDetailModel)
    private readonly giftCardOrderDetailModel: typeof GiftCardOrderDetailModel,
  ) {}

  public async createGiftCardOrder(
    orderInfo: GiftCardOrderDto,
    item: Item,
    transaction?: Transaction,
  ) {
    return this.giftCardOrderModel.create(
      {
        userName: orderInfo.name,
        email: orderInfo.email,
        amount: item.amount,
        tradeNo: createRandomString(12),
        status: GiftCardStatusEnum.UNPAID,
        ref: orderInfo.ref,
      },
      { transaction },
    );
  }

  public async createGiftCardOrderDetail(
    data: {
      orderId: number;
      itemId: number;
      itemCount: number;
    },
    transaction?: Transaction,
  ) {
    const { orderId, itemId, itemCount } = data;

    return this.giftCardOrderDetailModel.create(
      {
        orderId,
        itemId,
        count: itemCount,
      },
      { transaction },
    );
  }

  public async createGiftCard(
    data: Partial<GiftCardModel>,
    transaction?: Transaction,
  ) {
    return this.giftCardModel.create(
      {
        ...data,
        code: createRandomCode(),
      },
      { transaction },
    );
  }

  async findOneOrder(
    where: Partial<GiftCardOrderModel>,
  ): Promise<GiftCardOrderModel> {
    return this.findOneOrderBy(where, true);
  }

  async findOneOrderBy(
    where: Partial<GiftCardOrderModel>,
    includeDetail?: boolean,
  ) {
    const includeOptions = [];
    if (includeDetail)
      includeOptions.push({
        model: this.giftCardOrderDetailModel,
        as: 'orderDetails',
        include: [{ model: ItemModel }],
      });
    return this.giftCardOrderModel.findOne({
      where,
      include: includeOptions,
    });
  }

  async findGiftCardsByOrder(
    where: Partial<GiftCardOrderModel>,
  ): Promise<GiftCardModel[]> {
    const result = await this.giftCardOrderModel.findOne({
      where: { ...where },
      include: [
        {
          model: this.giftCardOrderDetailModel,
          as: 'orderDetails',
          include: [
            {
              model: this.giftCardModel,
              as: 'giftCards',
            },
          ],
        },
      ],
    });
    return result.orderDetails[0].giftCards;
  }

  async findOneGiftCardBy(
    where: WhereOptions<GiftCardModel>,
    includeOrderDetail?: boolean,
    transaction?: Transaction,
  ): Promise<GiftCardModel> {
    const includeOptions = [];
    if (includeOrderDetail)
      includeOptions.push({
        model: this.giftCardOrderDetailModel,
        as: 'orderDetails',
        include: [{ model: ItemModel }],
      });
    return this.giftCardModel.findOne({
      where,
      include: includeOptions,
      transaction,
    });
  }

  async findAllGiftCards(
    where: WhereOptions<GiftCardModel>,
    transaction?: Transaction,
  ) {
    return this.giftCardModel.findAll({ where, transaction });
  }

  async updateBulk(
    where: WhereOptions<GiftCardModel>,
    values: Partial<GiftCardModel>,
    transaction?: Transaction,
  ): Promise<GiftCardModel[]> {
    const [_, results] = await this.giftCardModel.update(values, {
      where,
      transaction,
      returning: true,
    });
    return results;
  }
}
