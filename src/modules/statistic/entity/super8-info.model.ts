import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'super8_info',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class Super8InfoModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  lineUid: string;

  @Column
  originalDisplayName: string;

  @Column(DataType.TEXT)
  refTag: string;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;
}
