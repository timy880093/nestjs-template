import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { TransactionStatusEnum } from './transaction-status.enum';

@Table({
  tableName: 'new_transaction',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: false, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class NewTransactionModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column(DataType.JSONB) rawRequest: object;
  @Column(DataType.JSONB) rawResponse: object;

  @Column(DataType.TEXT) status: TransactionStatusEnum;
  @Column tradeNo: string;
  @Column canceledAt: string;

  @Column(DataType.JSONB) rawInvoice: object;
  @Column invoiceNo: string;
  @Column invoiceRandomNo: string;
  @Column invoiceAt: Date;
  @Column invoiceError: string;
}
