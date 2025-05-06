import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TicketException } from '../../../common/exception/ticket.exception';
import { Transaction, WhereOptions } from 'sequelize';
import { OrderModel } from '../entity/order.model';
import { TicketSubmissionModel } from '../entity/ticket-submission.model';
import { TicketSubmissionDto } from '../dto/ticket-submission.dto';

@Injectable()
export class TicketSubmissionRepository {
  constructor(
    @InjectModel(TicketSubmissionModel)
    private readonly repository: typeof TicketSubmissionModel,
  ) {}

  async create(
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    try {
      if (dto.id) delete dto.id;
      const result = await this.repository.create({ ...dto }, { transaction });
      return TicketSubmissionModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Create ticketSubmission failed: ${e}`);
    }
  }

  async createBulk(
    dtos: Partial<TicketSubmissionDto>[],
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    dtos = dtos.map((dto) => {
      if (dto.id) delete dto.id;
      return dto;
    });
    const results = await this.repository.bulkCreate(dtos, { transaction });
    return TicketSubmissionModel.toDtos(results);
  }

  async findAllBy(
    where: WhereOptions<TicketSubmissionDto>,
    includeOrder: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    const includeOptions = [];
    if (includeOrder) {
      includeOptions.push({
        model: OrderModel,
      });
    }

    try {
      const results = await this.repository.findAll({
        where,
        order: sort,
        include: includeOptions,
        transaction,
      });
      return results.map((result) => TicketSubmissionModel.toDto(result));
    } catch (e) {
      throw new TicketException(
        `Find all ticketSubmission failed: ${e.message}`,
      );
    }
  }

  async findOneBy(
    where: WhereOptions<TicketSubmissionDto>,
    includeOrder?: boolean,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    const includeOptions = [];
    if (includeOrder) {
      includeOptions.push({ model: OrderModel });
    }
    try {
      const result = await this.repository.findOne({
        where: { ...where },
        include: includeOptions,
        rejectOnEmpty: undefined, //查無資料會 return null
        transaction,
      });
      return result && TicketSubmissionModel.toDto(result);
    } catch (e) {
      throw new TicketException(
        `Find ticketSubmission by ${JSON.stringify(where)} failed: ${e.message}`,
      );
    }
  }

  async update(
    id: number,
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    const results = await this.updateBulk({ id }, dto, transaction);
    return results[0];
  }

  async updateOnlyNullColumns(
    where: WhereOptions<TicketSubmissionDto>,
    updated: TicketSubmissionDto,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    const exists = await this.findOneBy(where, false, transaction);
    if (!exists) throw new TicketException(`Ticket not found: ${where}`);
    // 只更新不為 null 的欄位
    const dto = Object.keys(updated).reduce((acc, key) => {
      if (!exists[key] && updated[key]) acc[key] = updated[key];
      return acc;
    }, {} as TicketSubmissionDto);
    return this.update(exists.id, dto, transaction);
  }

  async updateBulk(
    where: WhereOptions<TicketSubmissionDto>,
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    try {
      const [, results] = await this.repository.update(dto, {
        where,
        returning: true,
        transaction,
      });
      return TicketSubmissionModel.toDtos(results);
    } catch (e) {
      throw new TicketException(
        `Update ticketSubmission by ${where} failed: ${e.message}`,
      );
    }
  }

  async upsert(
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    try {
      const [result, isCreated] = await this.repository.upsert(
        { ...dto },
        { transaction },
      );
      return TicketSubmissionModel.toDto(result);
    } catch (e) {
      throw new TicketException(`Upsert ticket failed: ${e.message}`);
    }
  }

  async remove(id: number, transaction?: Transaction): Promise<number> {
    try {
      return this.repository.destroy({
        where: { id },
        transaction,
      });
    } catch (e) {
      throw new TicketException(
        `Remove ticketSubmission by id ${id} failed: ${e.message}`,
      );
    }
  }
}
