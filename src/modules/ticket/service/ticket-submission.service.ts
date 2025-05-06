import { Injectable } from '@nestjs/common';
import { Transaction, WhereOptions } from 'sequelize';
import { TicketException } from '../../../common/exception/ticket.exception';
import { TicketSubmissionRepository } from '../repository/ticket-submission.repository';
import { TicketSubmissionDto } from '../dto/ticket-submission.dto';

@Injectable()
export class TicketSubmissionService {
  constructor(
    private readonly ticketSubmissionRepository: TicketSubmissionRepository,
  ) {}

  async findAll(
    where: WhereOptions<TicketSubmissionDto>,
    includeOrder: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionRepository.findAllBy(
      where,
      includeOrder,
      sort,
      transaction,
    );
  }

  async findAllTickets(userId?: number): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionRepository.findAllBy({ userId }, true, [
      ['updated_at', 'DESC'],
    ]);
  }

  async findOneById(
    id: number,
    includeOrder?: boolean,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.findOneBy({ id }, includeOrder, transaction);
  }

  async findOneBy(
    where: Partial<TicketSubmissionDto>,
    includeOrder: boolean,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.ticketSubmissionRepository.findOneBy(
      where,
      includeOrder,
      transaction,
    );
  }

  async create(
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.ticketSubmissionRepository.create(dto, transaction);
  }

  async createBulk(
    dtos: Partial<TicketSubmissionDto>[],
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    try {
      return this.ticketSubmissionRepository.createBulk(dtos, transaction);
    } catch (e) {
      throw new TicketException(`Create bulk ticket failed: ${e.message}`);
    }
  }

  async update(
    id: number,
    ticketDto: TicketSubmissionDto,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.ticketSubmissionRepository.update(id, ticketDto, transaction);
  }

  async updateBulk(
    where: WhereOptions<TicketSubmissionDto>,
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionRepository.updateBulk(where, dto, transaction);
  }

  async updateBulkByIds(
    id: number | number[],
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionRepository.updateBulk({ id }, dto, transaction);
  }

  async updateBulkByTicketIds(
    ticketId: number[],
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto[]> {
    return this.ticketSubmissionRepository.updateBulk(
      { ticketId },
      dto,
      transaction,
    );
  }

  async upsert(
    dto: Partial<TicketSubmissionDto>,
    transaction?: Transaction,
  ): Promise<TicketSubmissionDto> {
    return this.ticketSubmissionRepository.upsert(dto, transaction);
  }

  async remove(id: number, transaction?: Transaction): Promise<number> {
    return this.ticketSubmissionRepository.remove(id, transaction);
  }
}
