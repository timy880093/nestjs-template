import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { TransactionException } from 'src/common/exception/transaction.exception';
import { NewTransactionModel } from './new-transaction.model';

@Injectable()
export class NewTransactionRepository {
  constructor(
    @InjectModel(NewTransactionModel)
    private readonly repository: typeof NewTransactionModel,
  ) {}

  async findOne(
    where: Partial<NewTransactionModel>,
  ): Promise<NewTransactionModel> {
    // find related data by where condition

    const result = await this.repository.findOne({
      where: { ...where },
    });
    return result;
  }

  async findAll(
    where?: Partial<NewTransactionModel>,
  ): Promise<NewTransactionModel[]> {
    const result = await this.repository.findAll({ where: { ...where } });
    return result;
  }

  async create(
    dto: Partial<NewTransactionModel>,
    transaction?: Transaction,
  ): Promise<NewTransactionModel> {
    const result = await this.repository.create({ ...dto }, { transaction });
    return result;
  }

  async update(
    where: Partial<NewTransactionModel>,
    dto: Partial<NewTransactionModel>,
    transaction?: Transaction,
  ): Promise<NewTransactionModel> {
    try {
      const [, results] = await this.repository.update(
        { ...dto },
        {
          where,
          returning: true,
          transaction,
        },
      );
      return results[0];
    } catch (e) {
      throw new TransactionException(`Transaction update failed: ${e.message}`);
    }
  }
}
