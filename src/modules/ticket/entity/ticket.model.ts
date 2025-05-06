import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { TicketDto } from '../dto/ticket.dto';
import { UserModel } from '../../users/entity/user.model';
import { OrderModel } from './order.model';
import {
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { TicketSubmissionModel } from './ticket-submission.model';
import { SourceEnum } from '../../../common/dto/source.enum';
import { RecognizeLogModel } from './recognize-log.model';

@Table({
  tableName: 'ticket',
})
export class TicketModel extends Model<TicketModel> {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => UserModel)
  @Column
  userId: number;

  @ForeignKey(() => OrderModel)
  @Column(DataType.BIGINT)
  orderId?: number;

  @Column
  ticketNo: string;

  @Column
  licensePlateNo: string;

  @Column
  isTicketPaid: boolean;

  @Column
  expiresAt: Date;
  @Column
  isCompanyCar: boolean;

  @Column({
    // type: DataType.ENUM(
    //     CityEnum.TAIPEI,
    // ),
    type: DataType.TEXT,
  })
  assignedOfficeCity: CityEnum;

  @Column
  isTicketAssignedToDriver: boolean;

  @Column({
    // type: DataType.ENUM(
    //     TicketTypeEnum.ELECTRONIC,
    //     TicketTypeEnum.PAPER_RED_TICKET,
    //     TicketTypeEnum.PAPER_RED_TICKET_HANDWRITTEN,
    // ),
    type: DataType.TEXT,
  })
  ticketType: TicketTypeEnum;

  @Column(DataType.ARRAY(DataType.BIGINT))
  ticketInfoFileIds: number[];

  @Column(DataType.ARRAY(DataType.BIGINT))
  violationFileIds: number[];

  @Column
  ownerName: string;

  @Column
  ownerIdNo: string;

  @Column
  ownerBirthdate: Date;

  @Column
  isOwnerSameAsDriver: boolean;

  @Column
  driverName: string;

  @Column
  driverIdNo: string;

  @Column
  driverBirthdate: Date;

  @Column({
    field: 'violation_1_article',
  })
  violation1Article: string;

  @Column({
    field: 'violation_1_item',
  })
  violation1Item: string;

  @Column({
    field: 'violation_1_clause',
  })
  violation1Clause: string;

  @Column({
    field: 'violation_2_article',
  })
  violation2Article: string;

  @Column({
    field: 'violation_2_item',
  })
  violation2Item: string;

  @Column({
    field: 'violation_2_clause',
  })
  violation2Clause: string;

  @Column({
    field: 'violation_1_penalty',
  })
  violation1Penalty: string;

  @Column({
    field: 'violation_2_penalty',
  })
  violation2Penalty: string;

  @Column
  violationFine: number;

  @Column({
    // type: DataType.ENUM,
    // values: ['Type1', 'Type2', 'Other'],
    type: DataType.TEXT,
  })
  violationFactType: ViolationFactTypeEnum;

  @Column
  violationFact: string;

  @Column
  violateAt: Date;

  @Column({
    // type: DataType.ENUM(
    //     VehicleTypeEnum.CAR,
    //     VehicleTypeEnum.MOTORCYCLE,
    //     VehicleTypeEnum.BUS,
    // ),
    type: DataType.TEXT,
  })
  vehicleType: VehicleTypeEnum;

  @Column
  isDraft: boolean;

  @Column
  remark: string;

  @Column(DataType.TEXT)
  source: SourceEnum;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;

  @BelongsTo(() => OrderModel)
  orderModel?: OrderModel;

  @HasOne(() => TicketSubmissionModel)
  ticketSubmissionModel?: TicketSubmissionModel;

  @HasMany(() => RecognizeLogModel)
  recognizeLogModels?: RecognizeLogModel[];

  static toDto(model: TicketModel): TicketDto {
    if (!model) return null;
    const modelJson = model.toJSON();
    delete modelJson.orderModel;
    const ticket: TicketDto = plainToInstance(TicketDto, modelJson);
    ticket.id = model.id ? Number(model.id) : null;
    ticket.orderId = model.orderId ? Number(model.orderId) : null;
    ticket.ticketInfoFileIds = model.ticketInfoFileIds
      ? model.ticketInfoFileIds.map(Number)
      : [];
    ticket.violationFileIds = model.violationFileIds
      ? model.violationFileIds.map(Number)
      : [];
    ticket.orderDto = model.orderModel
      ? OrderModel.toDto(model.orderModel)
      : null;
    ticket.ticketSubmissionDto = model.ticketSubmissionModel
      ? TicketSubmissionModel.toDto(model.ticketSubmissionModel)
      : null;
    ticket.recognizeLogDtos = model.recognizeLogModels
      ? RecognizeLogModel.toDtos(model.recognizeLogModels)
      : null;
    // ticket.ticketInfoFile = UploadFilesModel.toDto(model.ticketInfoFile);
    // ticket.violationFiles = model.violationFiles.map((file) => UploadFilesModel.toDto(file));
    // ticket.expiresAt = DateUtil.zoneDate(model.expiresAt).toDate();
    return ticket;
  }

  static toDtos(models: TicketModel[]): TicketDto[] {
    return models.map((model) => TicketModel.toDto(model));
  }
}
