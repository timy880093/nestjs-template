import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TicketModel } from '../entity/ticket.model';
import { TicketDraftCreateDto } from '../dto/ticket-draft-create.dto';
import { TicketDto } from '../dto/ticket.dto';
import { TicketException } from '../../../common/exception/ticket.exception';
import { Transaction, ValidationErrorItem, WhereOptions } from 'sequelize';
import { OrderModel } from '../entity/order.model';
import { CommonUtil } from '../../../common/util/common.util';
import { TicketSubmissionModel } from '../entity/ticket-submission.model';
import { RecognizeLogModel } from '../entity/recognize-log.model';

@Injectable()
export class TicketRepository {
  constructor(
    @InjectModel(TicketModel)
    private readonly repository: typeof TicketModel,
  ) {}

  async create(
    dto: Partial<TicketDto>,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    try {
      const result = await this.repository.create({ ...dto }, { transaction });
      return TicketModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Create ticket failed: ${e.message}`);
    }
  }

  async createBulk(
    dtos: Partial<TicketDto>[],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    const results = await this.repository.bulkCreate(dtos, { transaction });
    return TicketModel.toDtos(results);
  }

  async createDraft(
    userId: number,
    ticketCreateDto: TicketDraftCreateDto,
  ): Promise<TicketDto> {
    try {
      const dto = TicketDraftCreateDto.toTicketDto(ticketCreateDto, userId);
      const result = await this.repository.create({ ...dto });
      return TicketModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Create draft ticket failed: ${e.message}`);
    }
  }

  async findAllBy(
    where: WhereOptions<TicketDto>,
    includeOrder: boolean,
    includeSubmission: boolean,
    includeRecognize: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    const includeOptions = [];
    if (includeOrder) includeOptions.push({ model: OrderModel });
    if (includeSubmission)
      includeOptions.push({ model: TicketSubmissionModel });
    if (includeRecognize) includeOptions.push({ model: RecognizeLogModel });
    try {
      const results = await this.repository.findAll({
        where,
        order: sort,
        include: includeOptions,
        transaction,
      });
      return results.map((result) => TicketModel.toDto(result));
    } catch (e) {
      throw new TicketException(`Find all tickets failed: ${e.message}`);
    }
  }

  async findOneById(id: number): Promise<TicketDto> {
    return this.findOne({ id }, true, false, false);
  }

  async findOne(
    where: WhereOptions<TicketDto>,
    includeOrder: boolean,
    includeSubmission: boolean,
    includeRecognize: boolean,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    const includeOptions = [];
    if (includeOrder) includeOptions.push({ model: OrderModel });
    if (includeSubmission)
      includeOptions.push({ model: TicketSubmissionModel });
    if (includeRecognize) includeOptions.push({ model: RecognizeLogModel });

    try {
      const result = await this.repository.findOne({
        where,
        include: includeOptions,
        rejectOnEmpty: undefined, //查無資料會 return null
        transaction,
      });
      return result && TicketModel.toDto(result);
    } catch (e) {
      throw new TicketException(
        `Find ticket by ${JSON.stringify(where)} failed: ${e.message}`,
      );
    }
  }

  async update(
    id: number,
    dto: TicketDto,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    const results = await this.updateBulk([id], dto, transaction);
    return results[0];
  }

  async updateBulk(
    id: number[],
    dto: TicketDto,
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    try {
      const [, results] = await this.repository.update(
        { ...dto },
        {
          where: { id },
          returning: true,
          transaction,
        },
      );
      return TicketModel.toDtos(results);
    } catch (e) {
      const errors = e.errors;
      if (
        CommonUtil.isArray(errors) &&
        errors[0] instanceof ValidationErrorItem
      ) {
        const detailedErrors = errors
          .map(
            (err) => `${err.message} (path: ${err.path}, value: ${err.value})`,
          )
          .join(', ');
        throw new TicketException(
          `Update ticket by id ${id} failed: Validation error: ${detailedErrors}`,
        );
      }
      throw new TicketException(
        `Update ticket by id ${id} failed: ${e.message}`,
      );
    }
  }

  async upsert(
    dto: Partial<TicketDto>,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    try {
      const [result, isCreated] = await this.repository.upsert(
        { ...dto },
        { transaction },
      );
      return TicketModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Upsert ticket failed: ${e.message}`);
    }
  }

  async remove(id: number, transaction?: Transaction): Promise<number> {
    try {
      return this.repository.destroy({ where: { id }, transaction });
    } catch (e) {
      throw new TicketException(
        `Remove ticket by id ${id} failed: ${e.message}`,
      );
    }
  }
}
