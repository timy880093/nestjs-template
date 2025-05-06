import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  col,
  fn,
  Includeable,
  literal,
  Op,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { SourceEnum } from '../../../common/dto/source.enum';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';
import { TicketException } from '../../../common/exception/ticket.exception';
import { UserModel } from '../../users/entity/user.model';
import { OrderDto } from '../dto/order.dto';
import { TrackEventDto } from '../dto/track-event.dto';
import { OrderModel } from '../entity/order.model';
import { TicketSubmissionModel } from '../entity/ticket-submission.model';
import { TicketModel } from '../entity/ticket.model';
import { TransactionModel } from '../entity/transaction.model';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectModel(OrderModel)
    private readonly repository: typeof OrderModel,
  ) {}

  async findOne(
    where: Partial<OrderDto>,
    includeUser: boolean,
    includeTickets: boolean,
    includeTransaction: boolean,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    const includeOptions = this.genIncludeOptions(
      includeUser,
      includeTickets,
      includeTransaction,
    );
    const result = await OrderModel.findOne({
      where: { ...where },
      include: includeOptions,
      transaction,
    });
    return OrderModel.toDto(result);
  }

  async findAll(
    where: WhereOptions<OrderDto>,
    includeUser: boolean,
    includeTickets: boolean,
    includeTransaction: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<OrderDto[]> {
    const includeOptions = this.genIncludeOptions(
      includeUser,
      includeTickets,
      includeTransaction,
    );
    const results = await OrderModel.findAll({
      where: { ...where },
      include: includeOptions,
      order: sort,
      transaction,
    });
    return results.map((result) => OrderModel.toDto(result));
  }

  private genIncludeOptions(
    includeUser: boolean,
    includeTickets: boolean,
    includeTransaction: boolean,
  ): Includeable[] {
    const includeOptions = [];
    if (includeUser) {
      includeOptions.push({ model: UserModel });
    }
    if (includeTickets) {
      includeOptions.push({ model: TicketModel });
      includeOptions.push({ model: TicketSubmissionModel });
    }
    if (includeTransaction) {
      includeOptions.push({
        model: TransactionModel,
      });
    }
    return includeOptions;
  }

  async create(
    dto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    try {
      const result = await this.repository.create({ ...dto }, { transaction });
      return OrderModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Create order failed: ${e.message}`);
    }
  }

  async update(
    id: number,
    dto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto> {
    return (await this.updateBulk(id, dto, transaction))[0];
  }

  async updateBulk(
    id: number | number[],
    dto: Partial<OrderDto>,
    transaction?: Transaction,
  ): Promise<OrderDto[]> {
    try {
      const [, results] = await this.repository.update(
        { ...dto },
        {
          where: { id },
          returning: true,
          transaction,
        },
      );
      return results.map((result) => OrderModel.toDto(result));
    } catch (e) {
      throw new TicketException(`Update order failed: ${e.message}`);
    }
  }

  async remove(id: number, transaction?: Transaction): Promise<number> {
    try {
      return this.repository.destroy({ where: { id }, transaction });
    } catch (e) {
      throw new TicketException(
        `Remove order by id ${id} failed: ${e.message}`,
      );
    }
  }

  async findAllForStatistic(
    startDate: Date,
    endDate: Date,
  ): Promise<TrackEventDto[]> {
    const dateFormat = fn('to_char', col('created_at'), 'YYYY-MM-DD');
    const results = await this.repository.findAll({
      attributes: [
        [dateFormat, 'date'],
        [fn('count', literal('1')), 'count'],
      ],
      where: {
        source: SourceEnum.NO_AUTH,
        createdAt: {
          [Op.not]: null,
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      group: [dateFormat],
      order: [[dateFormat, 'DESC']],
    });
    return results.map(
      (result) =>
        new TrackEventDto({
          event: TrackEventEnum.CLICK_CREATE_TICKET,
          date: result.get('date') as string,
          count: result.get('count') as number,
        }),
    );
  }
}
