import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { col, fn, literal, Op, Transaction } from 'sequelize';
import { IncludeOptions } from 'sequelize/types/model';
import { SourceEnum } from '../../../common/dto/source.enum';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';
import { TicketException } from '../../../common/exception/ticket.exception';
import {
  PaymentCategoryEnum,
  PaymentStatusEnum,
} from '../../../third-party/payment/dto';
import { TrackEventDto } from '../dto/track-event.dto';
import { TransactionDto } from '../dto/transaction.dto';
import { OrderModel } from '../entity/order.model';
import { TransactionModel } from '../entity/transaction.model';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectModel(TransactionModel)
    private readonly repository: typeof TransactionModel,
  ) {}

  async findOne(
    where: Partial<TransactionDto>,
    includeOrder?: boolean,
  ): Promise<TransactionDto> {
    // find related data by where condition
    const includeOptions: IncludeOptions[] = [];
    if (includeOrder) includeOptions.push({ model: OrderModel });

    const result = await this.repository.findOne({
      where: { ...where },
      include: includeOptions,
    });
    return TransactionModel.toDto(result);
  }

  async findAll(where?: Partial<TransactionDto>): Promise<TransactionDto[]> {
    const result = await this.repository.findAll({ where: { ...where } });
    return result.map((item) => TransactionModel.toDto(item));
  }

  async create(
    dto: TransactionDto,
    transaction?: Transaction,
  ): Promise<TransactionDto> {
    const result = await this.repository.create({ ...dto }, { transaction });
    return TransactionModel.toDto(result);
  }

  async update(
    where: Partial<TransactionDto>,
    dto: Partial<TransactionDto>,
    transaction?: Transaction,
  ): Promise<TransactionDto> {
    try {
      const [, results] = await this.repository.update(
        { ...dto },
        {
          where,
          returning: true,
          transaction,
        },
      );
      return TransactionModel.toDto(results[0]);
    } catch (e) {
      throw new TicketException(`Transaction update failed: ${e.message}`);
    }
  }

  async findAllForStatistic(
    startDate: Date,
    endDate: Date,
  ): Promise<TrackEventDto[]> {
    const dateFormat = fn('to_char', col('pay_at'), 'YYYY-MM-DD');
    const results = await this.repository.findAll({
      attributes: [
        [dateFormat, 'date'],
        [fn('count', literal('1')), 'count'],
      ],
      include: [
        {
          model: OrderModel,
          attributes: [],
          required: true,
          where: {
            source: SourceEnum.NO_AUTH,
          },
        },
      ],
      where: {
        category: PaymentCategoryEnum.SERVICE_FEE,
        status: PaymentStatusEnum.SUCCESSFUL,
        payAt: {
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
          event: TrackEventEnum.CLICK_PAYMENT,
          date: result.get('date') as string,
          count: result.get('count') as number,
        }),
    );
  }
}
