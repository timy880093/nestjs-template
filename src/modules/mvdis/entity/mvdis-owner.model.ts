import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { MvdisOwnerDto } from '../dto/mvdis-owner.dto';
import { MvdisTicketModel } from './mvdis-ticket.model';

@Table({
  tableName: 'mvdis_owner',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class MvdisOwnerModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column userId: number;
  @Column uid: string;
  @Column birthday: string;
  @Column createdAt: Date;
  @Column updatedAt: Date;
  @Column crawledAt: Date;

  @HasMany(() => MvdisTicketModel)
  mvdisTickets?: MvdisTicketModel[];

  static toMvdisOwnerDto(model: MvdisOwnerModel): MvdisOwnerDto {
    return plainToInstance(MvdisOwnerModel, model.toJSON());
  }
}
