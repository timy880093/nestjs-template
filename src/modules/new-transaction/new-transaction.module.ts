import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NewTransactionModel } from './new-transaction.model';
import { NewTransactionService } from './new-transaction.service';
import { NewTransactionRepository } from './new-transaction.repository';

@Module({
  imports: [SequelizeModule.forFeature([NewTransactionModel])],
  providers: [NewTransactionService, NewTransactionRepository],
  exports: [SequelizeModule, NewTransactionService, NewTransactionRepository],
})
export class NewTransactionModule {}
