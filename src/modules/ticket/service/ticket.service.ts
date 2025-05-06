import { Injectable } from '@nestjs/common';
import { TicketDto } from '../dto/ticket.dto';
import { TicketRepository } from '../repository/ticket.repository';
import { Transaction, WhereOptions } from 'sequelize';
import { TicketDraftCreateDto } from '../dto/ticket-draft-create.dto';
import { TicketException } from '../../../common/exception/ticket.exception';

@Injectable()
export class TicketService {
  constructor(private readonly ticketRepository: TicketRepository) {}

  async findAll(
    dto: WhereOptions<TicketDto>,
    includeOrder?: boolean,
    includeSubmission?: boolean,
    includeRecognize?: boolean,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    return this.ticketRepository.findAllBy(
      dto,
      includeOrder,
      includeSubmission,
      includeRecognize,
      sort,
      transaction,
    );
  }

  async findAllForDuplicatedTicketNos(
    ticketNos: string[],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    // 非草稿, 且未完成的單
    const results = await this.ticketRepository.findAllBy(
      { ticketNo: ticketNos, isDraft: false },
      true,
      false,
      false,
      null,
      transaction,
    );
    return results.filter((t) => !t.orderDto.isCompleted());
  }

  async findAllByUserId(userId?: number): Promise<TicketDto[]> {
    return this.ticketRepository.findAllBy({ userId }, true, false, false, [
      ['updated_at', 'DESC'],
    ]);
  }

  async findOneById(id: number): Promise<TicketDto> {
    return this.ticketRepository.findOneById(id);
  }

  async findOne(
    dto: Partial<TicketDto>,
    includeOrder?: boolean,
    includeSubmission?: boolean,
    includeRecognize?: boolean,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    return this.ticketRepository.findOne(
      dto,
      includeOrder,
      includeSubmission,
      includeRecognize,
      transaction,
    );
  }

  async create(
    dto: Partial<TicketDto>,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    if (dto.id) delete dto.id;
    return this.ticketRepository.create(dto, transaction);
  }

  async createBulk(
    dtos: Partial<TicketDto>[],
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    try {
      dtos = dtos.map((dto) => {
        if (dto.id) delete dto.id;
        return dto;
      });
      return this.ticketRepository.createBulk(dtos, transaction);
    } catch (e) {
      throw new TicketException(`Create bulk ticket failed: ${e.message}`);
    }
  }

  async createDraft(
    userId: number,
    ticketCreateDto: TicketDraftCreateDto,
  ): Promise<TicketDto> {
    return this.ticketRepository.createDraft(userId, ticketCreateDto);
  }

  async update(
    id: number,
    ticketDto: TicketDto,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    return this.ticketRepository.update(id, ticketDto, transaction);
  }

  async updateOnlyNullColumns(
    id: number,
    updated: TicketDto,
    transaction?: Transaction,
  ) {
    const exists = await this.findOne({ id }, false, false, false, transaction);
    if (!exists) throw new TicketException(`Ticket not found: ${id}`);
    // 只更新不為 null 的欄位
    const ticketDto = Object.keys(updated).reduce((acc, key) => {
      if (!exists[key] && updated[key]) acc[key] = updated[key];
      return acc;
    }, {} as TicketDto);
    return this.update(id, ticketDto, transaction);
  }

  async updateBulk(
    id: number[],
    ticketDto: TicketDto,
    transaction?: Transaction,
  ): Promise<TicketDto[]> {
    return this.ticketRepository.updateBulk(id, ticketDto, transaction);
  }

  async upsert(
    dto: Partial<TicketDto>,
    transaction?: Transaction,
  ): Promise<TicketDto> {
    return this.ticketRepository.upsert(dto, transaction);
  }

  async remove(id: number, transaction?: Transaction): Promise<number> {
    return this.ticketRepository.remove(id, transaction);
  }
}
