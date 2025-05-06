import { plainToInstance, Transform } from 'class-transformer';
import { OrderDto } from './order.dto';
import { UploadFilesDto } from '../../upload/dto/upload-files.dto';
import {
  AppealResultEnum,
  BotSubmittedStatusEnum,
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { SourceEnum } from '../../../common/dto/source.enum';

export class TicketSubmissionDto {
  id: number;
  userId: number;
  ticketId: number;
  orderId?: number;
  isTicketPaid: boolean;
  expiresAt: Date;
  isCompanyCar: boolean;
  assignedOfficeCity: CityEnum;
  isTicketAssignedToDriver: boolean;
  ticketType: TicketTypeEnum;
  @Transform(({ value }) => (value ? value.map(Number) : []))
  ticketInfoFileIds: number[];
  @Transform(({ value }) => (value ? value.map(Number) : []))
  violationFileIds: number[];
  ownerName: string;
  ownerIdNo: string;
  ownerBirthdate: Date;
  isOwnerSameAsDriver: boolean;
  driverName: string;
  driverIdNo: string;
  driverBirthdate: Date;
  violation1Article: string;
  violation1Item: string;
  violation1Clause: string;
  violation2Article: string;
  violation2Item: string;
  violation2Clause: string;
  violation1Penalty: string;
  violation2Penalty: string;
  violationFine: number;
  violationFactType: ViolationFactTypeEnum;
  violationFact: string;
  violateAt: Date;
  ticketNo: string;
  licensePlateNo: string;
  vehicleType: VehicleTypeEnum;
  isDraft: boolean;
  remark: string;
  source: SourceEnum;
  queryInfo: Record<string, any> | Record<string, any>[];
  botSubmittedStatus: BotSubmittedStatusEnum;
  botSubmittedAt: Date;
  botSuccessAt: Date;
  appealResult: AppealResultEnum;
  appealExpiresAt: Date;
  appealViolationPenalty: string;
  appealViolationFine: number;
  createdAt: Date;
  updatedAt: Date;
  ticketInfoFiles: UploadFilesDto[];
  violationFiles: UploadFilesDto[];
  orderDto?: OrderDto;

  // ticketDto?: TicketDto;

  constructor(data: Partial<TicketSubmissionDto>) {
    return plainToInstance(TicketSubmissionDto, data);
  }
}
