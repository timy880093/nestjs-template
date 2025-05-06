import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { MvdisOwnerDto } from '../dto/mvdis-owner.dto';
import { MvdisTicketDto } from '../dto/mvdis-ticket.dto';
import { MvdisOwnerModel } from './mvdis-owner.model';

@Table({
  tableName: 'mvdis_ticket',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class MvdisTicketModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => MvdisOwnerModel)
  @Column(DataType.INTEGER)
  ownerId: number;

  @Column
  adDate: number;

  @Column
  status: boolean;

  @Column
  items: number;

  @Column
  vilDate: string;

  @Column
  vilDateStr: string;

  @Column
  vilFact: string;

  @Column
  arrivedDate: string;

  @Column
  arrivedDateStr: string;

  @Column
  vilTicket: string;

  @Column
  plateNo: string;

  @Column
  vehKind: string;

  @Column
  payment: number;

  @Column
  penalty: number;

  @Column
  dmv: string;

  @Column
  respTp: string;

  @Column
  location: string;

  @Column
  law: string;

  @Column
  office: string;

  static toMvdisOwnerDto(model: MvdisTicketModel): MvdisTicketDto {
    return plainToInstance(MvdisTicketModel, model.toJSON());
  }
}
