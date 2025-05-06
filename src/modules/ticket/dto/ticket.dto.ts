import { plainToInstance, Transform } from 'class-transformer';
import { OrderDto } from './order.dto';
import { IsNotEmpty } from 'class-validator';
import { UploadFilesDto } from '../../upload/dto/upload-files.dto';
import {
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { TicketSubmissionDto } from './ticket-submission.dto';
import { RecognizeLogDto } from './recognize-log.dto';
import { SourceEnum } from '../../../common/dto/source.enum';
import { CommonUtil } from '../../../common/util';

export class TicketDto {
  @IsNotEmpty() id: number;
  @IsNotEmpty() userId: number;
  orderId?: number;
  @IsNotEmpty() isTicketPaid: boolean;
  @IsNotEmpty() expiresAt: Date;
  @IsNotEmpty() isCompanyCar: boolean;
  @IsNotEmpty() assignedOfficeCity: CityEnum;
  @IsNotEmpty() isTicketAssignedToDriver: boolean;
  @IsNotEmpty() ticketType: TicketTypeEnum;
  @Transform(({ value }) => (value ? value.map(Number) : []))
  ticketInfoFileIds: number[];
  @Transform(({ value }) => (value ? value.map(Number) : []))
  violationFileIds: number[];
  @IsNotEmpty() ownerName: string;
  @IsNotEmpty() ownerIdNo: string;
  @IsNotEmpty() ownerBirthdate: Date;
  @IsNotEmpty() isOwnerSameAsDriver: boolean;
  @IsNotEmpty() driverName: string;
  @IsNotEmpty() driverIdNo: string;
  @IsNotEmpty() driverBirthdate: Date;
  @IsNotEmpty() violation1Article: string;
  @IsNotEmpty() violation1Item: string;
  @IsNotEmpty() violation1Clause: string;
  violation2Article: string;
  violation2Item: string;
  violation2Clause: string;
  violation1Penalty: string;
  violation2Penalty: string;
  violationFine: number;
  @IsNotEmpty() violationFactType: ViolationFactTypeEnum;
  violationFact: string;
  @IsNotEmpty() violateAt: Date;
  @IsNotEmpty() ticketNo: string;
  @IsNotEmpty() licensePlateNo: string;
  @IsNotEmpty() vehicleType: VehicleTypeEnum;
  @IsNotEmpty() isDraft: boolean;
  remark: string;
  source: SourceEnum;
  createdAt: Date;
  updatedAt: Date;
  ticketInfoFiles: UploadFilesDto[];
  violationFiles: UploadFilesDto[];
  orderDto?: OrderDto;
  ticketSubmissionDto?: TicketSubmissionDto;
  recognizeLogDtos?: RecognizeLogDto[];

  constructor(data: Partial<TicketDto>) {
    Object.assign(this, data);
  }

  allFileIds(): number[] {
    return [
      ...(this.ticketInfoFileIds || []),
      ...(this.violationFileIds || []),
    ];
  }

  isRecognizeLogExists(): boolean {
    return CommonUtil.isArray(this.recognizeLogDtos);
  }

  static build(dto: Partial<TicketDto>): TicketDto {
    return plainToInstance(TicketDto, dto);
  }

  static buildSubmission(ticket: Partial<TicketDto>): TicketSubmissionDto {
    const submission = plainToInstance(TicketSubmissionDto, ticket);
    submission.id = null;
    submission.ticketId = ticket.id;
    return submission;
  }

  static buildRecognizeLog(
    ticket: Partial<TicketDto>,
    result: Record<string, any> | Record<string, any>[],
  ): RecognizeLogDto {
    return new RecognizeLogDto({
      userId: ticket.userId,
      ticketId: ticket.id,
      ticketInfoFileIds: ticket.allFileIds(),
      result,
    });
  }

  static merge(
    original: TicketDto,
    updated: Partial<TicketDto>,
    isDraft: boolean,
  ): TicketDto {
    const final = plainToInstance(TicketDto, {
      ...original,
      ...updated,
    });
    final.isDraft = isDraft;
    return final;
  }
}
