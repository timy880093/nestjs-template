import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { UserModel } from '../../users/entity/user.model';
import { TicketModel } from './ticket.model';
import { RecognizeLogDto } from '../dto/recognize-log.dto';
import { CommonUtil } from '../../../common/util/common.util';

@Table({ tableName: 'recognize_log' })
export class RecognizeLogModel extends Model<RecognizeLogModel> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => UserModel)
  @Column
  userId: number;

  @ForeignKey(() => TicketModel)
  @Column(DataType.BIGINT)
  ticketId: number;

  @Column(DataType.ARRAY(DataType.BIGINT))
  ticketInfoFileIds: number[];

  @Column(DataType.JSONB)
  result: Record<string, any> | Record<string, any>[];

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;

  static toDto(model: RecognizeLogModel): RecognizeLogDto {
    if (!model) return null;
    const recognizeLogDto = plainToInstance(RecognizeLogDto, model.toJSON());
    recognizeLogDto.id = model.id ? Number(model.id) : null;
    recognizeLogDto.ticketId = model.ticketId ? Number(model.ticketId) : null;
    recognizeLogDto.ticketInfoFileIds = CommonUtil.toNumberArray(
      recognizeLogDto.ticketInfoFileIds,
    );
    return recognizeLogDto;
  }

  static toDtos(models: RecognizeLogModel[]): RecognizeLogDto[] {
    return models.map((model) => RecognizeLogModel.toDto(model));
  }
}
