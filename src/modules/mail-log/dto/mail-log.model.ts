import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { MailLogCategory, MailLogStatus } from './mail-log.enum';

@Table({ tableName: 'mail_log', timestamps: true, paranoid: true })
export class MailLogModel extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column(DataType.TEXT)
  status: MailLogStatus;

  @Column(DataType.TEXT)
  category: MailLogCategory;

  @Column
  from: string;

  @Column
  to: string;

  @Column(DataType.ARRAY(DataType.TEXT))
  // @Column(DataType.ARRAY(DataType.TEXT))
  cc: string[];

  @Column(DataType.ARRAY(DataType.TEXT))
  bcc: string[];

  @Column
  subject: string;

  @Column
  template: string;

  @Column
  html: string;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;

  @Column
  deletedAt: Date;
}
