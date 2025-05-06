import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { UserModel } from '../../users/entity/user.model';
import { OrderModel } from './order.model';
import {
  AppealResultEnum,
  BotSubmittedStatusEnum,
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { TicketSubmissionDto } from '../dto/ticket-submission.dto';
import { TicketModel } from './ticket.model';
import { CommonUtil } from '../../../common/util/common.util';
import { SourceEnum } from '../../../common/dto/source.enum';

@Table({
  tableName: 'ticket_submission',
})
export class TicketSubmissionModel extends Model<TicketSubmissionModel> {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => UserModel)
  @Column
  userId: number;

  @ForeignKey(() => TicketModel)
  @Column(DataType.BIGINT)
  ticketId: number;

  @ForeignKey(() => OrderModel)
  @Column(DataType.BIGINT)
  orderId: number;
  @Unique
  @Column
  ticketNo: string;
  @Column licensePlateNo: string;
  @Column isTicketPaid: boolean;
  @Column expiresAt: Date;
  @Column isCompanyCar: boolean;

  @Column({
    // type: DataType.ENUM(
    //     CityEnum.TAIPEI,
    // ),
    type: DataType.TEXT,
  })
  assignedOfficeCity: CityEnum;

  @Column isTicketAssignedToDriver: boolean;

  @Column({
    // type: DataType.ENUM(
    //     TicketTypeEnum.ELECTRONIC,
    //     TicketTypeEnum.PAPER_RED_TICKET,
    //     TicketTypeEnum.PAPER_RED_TICKET_HANDWRITTEN,
    // ),
    type: DataType.TEXT,
  })
  ticketType: TicketTypeEnum;

  @Column({
    type: DataType.ARRAY(DataType.BIGINT),
  })
  ticketInfoFileIds: number[];
  @Column({
    type: DataType.ARRAY(DataType.BIGINT),
  })
  violationFileIds: number[];

  @Column ownerName: string;
  @Column ownerIdNo: string;
  @Column
  ownerBirthdate: Date;
  @Column isOwnerSameAsDriver: boolean;
  @Column driverName: string;
  @Column driverIdNo: string;
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

  @Column violationFact: string;
  @Column violateAt: Date;
  @Column({
    // type: DataType.ENUM(
    //     VehicleTypeEnum.CAR,
    //     VehicleTypeEnum.MOTORCYCLE,
    //     VehicleTypeEnum.BUS,
    // ),
    type: DataType.TEXT,
  })
  vehicleType: VehicleTypeEnum;

  @Column isDraft: boolean;

  @Column remark: string;

  @Column(DataType.TEXT)
  source: SourceEnum;

  @Column(DataType.JSONB)
  queryInfo: Record<string, any> | Record<string, any>[];

  @Column(DataType.TEXT)
  botSubmittedStatus: BotSubmittedStatusEnum;

  @Column
  botSubmittedAt: Date;
  @Column
  botSuccessAt: Date;
  @Column({ type: DataType.TEXT })
  appealResult: AppealResultEnum;
  @Column
  appealExpiresAt: Date;
  @Column
  appealViolationPenalty: string;
  @Column
  appealViolationFine: number;
  @Column createdAt: Date;
  @Column updatedAt: Date;

  @BelongsTo(() => OrderModel)
  orderModel: OrderModel;

  // @BelongsTo(() => TicketModel)
  // ticketModel?: TicketModel;

  static toDto(model: TicketSubmissionModel): TicketSubmissionDto {
    try {
      if (!model) return null;
      const modelJson = model.toJSON();
      delete modelJson.orderModel;
      const ticket = plainToInstance(TicketSubmissionDto, modelJson);
      ticket.queryInfo = CommonUtil.convertJsonToObject(model.queryInfo);
      ticket.id = model.id ? Number(model.id) : null;
      ticket.ticketId = model.ticketId ? Number(model.ticketId) : null;
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
      // ticket.ticketDto = model.ticketModel ? TicketModel.toDto(model.ticketModel) : null;
      // ticket.ticketInfoFile = UploadFilesModel.toDto(model.ticketInfoFile);
      // ticket.violationFiles = model.violationFiles.map((file) => UploadFilesModel.toDto(file));
      // ticket.expiresAt = DateUtil.zoneDate(model.expiresAt).toDate();
      return ticket;
    } catch (e) {
      console.warn('TicketSubmissionModel.toDto', e);
      return null;
    }
  }

  static toDtos(models: TicketSubmissionModel[]): TicketSubmissionDto[] {
    return models.map((model) => TicketSubmissionModel.toDto(model));
  }
}
