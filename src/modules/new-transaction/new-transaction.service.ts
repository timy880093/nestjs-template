import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';

import { NewTransactionRepository } from './new-transaction.repository';
import { NewTransactionModel } from './new-transaction.model';

@Injectable()
export class NewTransactionService {
  constructor(
    // @InjectPinoLogger(NewTransactionService.name)
    private readonly transactionRepository: NewTransactionRepository,
  ) {}

  async findOne(
    dto: Partial<NewTransactionModel>,
  ): Promise<NewTransactionModel> {
    return this.transactionRepository.findOne(dto);
  }

  async findAll(
    dto?: Partial<NewTransactionModel>,
  ): Promise<NewTransactionModel[]> {
    return this.transactionRepository.findAll(dto);
  }

  async create(
    dto: Partial<NewTransactionModel>,
    transaction?: Transaction,
  ): Promise<NewTransactionModel> {
    return this.transactionRepository.create(dto, transaction);
  }

  async update(
    where: Partial<NewTransactionModel>,
    dto: Partial<NewTransactionModel>,
    transaction?: Transaction,
  ): Promise<NewTransactionModel> {
    return this.transactionRepository.update(where, dto, transaction);
  }
}
