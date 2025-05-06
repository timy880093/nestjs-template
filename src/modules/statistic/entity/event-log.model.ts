import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { EventLogStatusEnum } from '../dto';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';

@Table({
  tableName: 'event_log',
  timestamps: false, // 自動加 createdAt, updatedAt
  paranoid: false, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class EventLogModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column time: Date;
  @Column(DataType.TEXT)
  status: EventLogStatusEnum;
  @Column(DataType.TEXT)
  event: TrackEventEnum;
  @Column endpoint: string;
  @Column(DataType.JSONB)
  additionalInfo: Record<string, any>;
  @Column userId: number;
  @Column orderId: number;
}
