import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MvdisOwnerModel } from './entity/mvdis-owner.model';
import { MvdisTicketModel } from './entity/mvdis-ticket.model';
import { CrawlerTicketDto } from './dto/crawler-ticket.dto';
import { MvdisException } from 'src/common/exception/mvdis.exception';
import { Transaction, WhereOptions } from 'sequelize';

@Injectable()
export class MvdisRepository {
  constructor(
    @InjectModel(MvdisOwnerModel)
    private readonly mvdisOwnerModel: typeof MvdisOwnerModel,
    @InjectModel(MvdisTicketModel)
    private readonly mvdisTicketModel: typeof MvdisTicketModel,
  ) {}

  async createMvdisOwner(
    data: Partial<MvdisOwnerModel>,
    crawlerTickets: CrawlerTicketDto[],
    transaction?: Transaction,
  ) {
    const owner = await this.mvdisOwnerModel.create(data, { transaction });

    await this.mvdisTicketModel.bulkCreate(
      crawlerTickets.map((t) => ({ ...t, ownerId: owner.id })),
      { transaction },
    );
  }

  async deleteMvdisList(
    data: { ownerId: number; userId: number },
    transaction: Transaction,
  ) {
    const { ownerId, userId } = data;
    const owner = await this.mvdisOwnerModel.findOne({
      where: { id: ownerId, userId },
    });
    if (!owner) throw new MvdisException('找不到指定的車主');
    await this.mvdisOwnerModel.destroy({
      where: { id: owner.id },
      transaction,
    });
    await this.mvdisTicketModel.destroy({
      where: { ownerId: owner.id },
      transaction,
    });
  }

  async findMvdisList(
    userId: number,
    transaction?: Transaction,
  ): Promise<MvdisOwnerModel[]> {
    return this.findAllMvdisOwner({ userId }, true, transaction);
  }

  async findAllMvdisOwner(
    where: WhereOptions<MvdisOwnerModel>,
    includeMvdisTicket?: boolean,
    transaction?: Transaction,
  ): Promise<MvdisOwnerModel[]> {
    const include = [];
    if (includeMvdisTicket)
      include.push({ model: this.mvdisTicketModel, as: 'mvdisTickets' });
    return this.mvdisOwnerModel.findAll({ where, include, transaction });
  }

  async renewMvdisTicketList(
    userId: number,
    crawlerTickets: CrawlerTicketDto[],
    transaction: Transaction,
  ) {
    await this.mvdisOwnerModel.update(
      { crawledAt: new Date() },
      { where: { userId }, transaction },
    );
    await this.mvdisTicketModel.destroy({
      where: { ownerId: userId },
      transaction,
    });
    await this.mvdisTicketModel.bulkCreate(
      crawlerTickets.map((t) => ({ ...t, ownerId: userId })),
      { transaction },
    );
  }

  async checkOwnerExist(data: {
    userId: number;
    uid: string;
    birthday: string;
  }): Promise<MvdisOwnerModel> {
    const { userId, uid, birthday } = data;
    const owner = await this.mvdisOwnerModel.findOne({
      where: { userId, uid, birthday },
    });
    return owner;
  }
}
