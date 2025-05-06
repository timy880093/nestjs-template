import { Injectable } from '@nestjs/common';
import { TrackEventDto } from '../dto/track-event.dto';
import { TransactionRepository } from '../repository/transaction.repository';
import { TransactionDto } from '../dto/transaction.dto';
import { Transaction } from 'sequelize';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotfoundException } from '../../../common/exception/notfound.exception';

@Injectable()
export class TransactionService {
  constructor(
    @InjectPinoLogger(TransactionService.name)
    private readonly logger: PinoLogger,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async findOne(
    dto: Partial<TransactionDto>,
    includeOrder?: boolean,
  ): Promise<TransactionDto> {
    return this.transactionRepository.findOne(dto, includeOrder);
  }

  async findOneOrThrow(
    dto: Partial<TransactionDto>,
    includeOrder?: boolean,
  ): Promise<TransactionDto> {
    const result = await this.transactionRepository.findOne(dto, includeOrder);
    if (!result) throw new NotfoundException(`Transaction(${dto}) not found`);
    return result;
  }

  async findAll(dto?: Partial<TransactionDto>): Promise<TransactionDto[]> {
    return this.transactionRepository.findAll(dto);
  }

  async create(
    dto: TransactionDto,
    transaction?: Transaction,
  ): Promise<TransactionDto> {
    return this.transactionRepository.create(dto, transaction);
  }

  async update(
    where: Partial<TransactionDto>,
    dto: Partial<TransactionDto>,
    transaction?: Transaction,
  ): Promise<TransactionDto> {
    return this.transactionRepository.update(where, dto, transaction);
  }

  async findAllForStatistic(
    startDate: Date,
    endDate: Date,
  ): Promise<TrackEventDto[]> {
    return this.transactionRepository.findAllForStatistic(startDate, endDate);
  }
}
