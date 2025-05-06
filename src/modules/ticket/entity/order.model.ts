import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { OrderDto } from '../dto/order.dto';
import { ProgressEnum } from '../enums/order.enum';
import { TicketModel } from './ticket.model';
import { UserModel } from '../../users/entity/user.model';
import { TransactionModel } from './transaction.model';
import { CommonUtil } from '../../../common/util';
import { PaymentStatusEnum } from '../../../third-party/payment/dto';
import { TicketSubmissionModel } from './ticket-submission.model';
import { SourceEnum } from '../../../common/dto/source.enum';

@Table({
  tableName: 'order',
})
export class OrderModel extends Model<OrderModel> {
  @PrimaryKey
  @AutoIncrement
  @Unique
  @Column(DataType.BIGINT)
  id: number;

  @ForeignKey(() => UserModel)
  @Column({
    allowNull: false,
  })
  userId: number;

  @Unique
  @Column
  orderNo: string;

  @Column
  groupName: string;

  @Column
  claimType: string;

  @Column({
    type: DataType.TEXT,
    // values: Object.values(ProgressEnum),
    // allowNull: false,
    // defaultValue: ProgressEnum.Pending, // Assuming 'Pending' is a valid value in ProgressEnum
  })
  progress: ProgressEnum;

  @Column
  generatedClaim: string;

  @Column
  userStatement: string;

  @Column({
    type: DataType.ARRAY(DataType.BIGINT),
  })
  additionalAttachmentIds: number[];

  @Column
  finalClaim: string;

  @Column(DataType.JSONB)
  answeredClaim: Record<string, any> | Record<string, any>[];

  @Column(DataType.JSONB)
  queryInfo: Record<string, any> | Record<string, any>[];

  @Column({
    // type: DataType.ENUM,
    // values: Object.values(PaymentStatusEnum),
    // allowNull: false,
    // defaultValue: PaymentStatusEnum.Unpaid, // Assuming 'Pending' is a valid value in ProgressEnum
    type: DataType.TEXT,
  })
  paymentStatus: PaymentStatusEnum;

  @Column(DataType.BIGINT)
  latestTransactionId: number;

  @Column
  claimUserId: number;

  @Column
  resultUserId: number;

  @Column
  remark: string;

  @Column(DataType.TEXT)
  source: SourceEnum;

  @Column
  email: string;

  @Column
  phone: string;

  @Column(DataType.ARRAY(DataType.INTEGER))
  progressDoneGiftCardId: number[];

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;
  @Column
  userCompletedAt: Date;
  @Column
  processedAt: Date;
  @Column
  submittedAt: Date;
  @Column
  receivedAt: Date;
  @Column
  emailProcessingAt: Date;
  @Column
  emailSubmittedAt: Date;
  @Column
  emailCompletedAt: Date;

  @BelongsTo(() => UserModel)
  userModel: UserModel;

  @HasMany(() => TicketModel)
  ticketModels?: TicketModel[];

  @HasMany(() => TicketSubmissionModel)
  ticketSubmissionModels?: TicketSubmissionModel[];

  @HasMany(() => TransactionModel)
  transactionModels?: TransactionModel[];

  static toDto(model: OrderModel): OrderDto {
    if (!model) return null;
    const modelJson = model.toJSON();
    delete modelJson.userModel;
    delete modelJson.ticketModels;
    delete modelJson.ticketSubmissionModels;
    delete modelJson.transactionModels;
    const order = plainToInstance(OrderDto, modelJson);
    const receivedTransactions = model.transactionModels
      ?.map((t) => TransactionModel.toDto(t))
      ?.filter((t) => t.hasReceived())
      ?.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); //FIXME 可能改成 payAt 免費也要加payAt
    order.user = model.userModel ? UserModel.toUserDto(model.userModel) : null;
    order.tickets = model.ticketModels?.map((model) =>
      TicketModel.toDto(model),
    );
    order.ticketSubmissions = model.ticketSubmissionModels?.map((model) =>
      TicketSubmissionModel.toDto(model),
    );
    // 若有 latestTransactionId 才顯示 latestTransaction
    order.latestTransaction =
      model.latestTransactionId && CommonUtil.isArray(model.transactionModels)
        ? TransactionModel.toDto(model.transactionModels[0])
        : null;

    order.firstStageTransaction =
      receivedTransactions?.find((t) => t.isFirstStage() && t.isSuccessful()) ||
      receivedTransactions?.find((t) => t.isFirstStage() && t.isFailed());

    order.secondStageTransaction =
      receivedTransactions?.find(
        (t) => t.isSecondStage() && t.isSuccessful(),
      ) || receivedTransactions?.find((t) => t.isSecondStage() && t.isFailed());

    order.id = CommonUtil.toNumber(model.id);
    order.additionalAttachmentIds = CommonUtil.toNumberArray(
      model.additionalAttachmentIds,
    );
    order.answeredClaim = CommonUtil.convertJsonToObject(model.answeredClaim);
    order.queryInfo = CommonUtil.convertJsonToObject(model.queryInfo);
    return order;
  }
}
