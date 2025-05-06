import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ErrorUtil } from '../../../common/util/error.util';
import {
  CityEnum,
  TicketTypeEnum,
  VehicleTypeEnum,
  ViolationFactTypeEnum,
} from '../enums/ticket.enum';
import { TicketPattern } from './ticket-pattern.const';
import { TicketDto } from './ticket.dto';
import { ValidateBirthdate } from '../../../common/validator/birthdate.constraints';
import { IsFine } from '../../../common/validator/fine.constraints';
import { IsIdNumberOrTaxId } from '../../../common/validator/id-number-or-tax-id.constraints';
import { IsIdNumber } from '../../../common/validator/id-number.constraints';

@ValidateBirthdate()
export class TicketUpdateReq {
  @IsBoolean({ message: TicketPattern.isTicketPaid.message })
  @ApiProperty({
    default: false,
    description: '是否已支付罰單',
    example: false,
  })
  isTicketPaid: boolean;

  @IsDate({ message: TicketPattern.expiresAt.message })
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty({ description: '罰單到期日', example: '110/12/31 | 110-12-31' })
  expiresAt: Date;

  @IsOptional()
  @IsBoolean({ message: TicketPattern.isCompanyCar.message })
  @ApiProperty({ description: '是否為公司車', example: true })
  isCompanyCar: boolean;

  @IsEnum(CityEnum, { message: TicketPattern.assignedOfficeCity.message })
  @ApiProperty({
    required: true,
    description: '應到案處所',
    example: CityEnum.TAIPEI,
  })
  assignedOfficeCity: CityEnum;

  @IsEnum(TicketTypeEnum, { message: TicketPattern.ticketType.message })
  @ApiProperty({ description: '罰單類型', example: TicketTypeEnum.ELECTRONIC })
  ticketType: TicketTypeEnum;

  @IsOptional()
  @IsArray({ message: TicketPattern.ticketInfoFileIds.message })
  @ApiProperty({
    description: '罰單資料 id',
    example: [1, 2],
  })
  ticketInfoFileIds: number[];

  @IsOptional()
  @IsArray({ message: TicketPattern.violationFileIds.message })
  @ApiProperty({
    description: '違規照片 id',
    example: [1, 2],
  })
  violationFileIds: number[];

  @IsString({ message: ErrorUtil.invalidString('ownerName') })
  @ApiProperty({ description: '車主姓名', example: '王小明' })
  ownerName: string;

  @IsIdNumberOrTaxId({
    message: ErrorUtil.invalid(
      'ownerIdNo',
      'must be a valid id number or tax id',
    ),
  })
  @ApiProperty({
    description: '車主身分證字號/統一編號',
    example: 'A123456789',
  })
  ownerIdNo: string;

  @IsOptional()
  @IsDate({ message: ErrorUtil.invalidDate('ownerBirthdate') })
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty({
    description: '車主出生日期',
    example: '2022-01-01T00:00:00.000Z',
  })
  ownerBirthdate: Date;

  @IsBoolean({ message: ErrorUtil.invalidBoolean('isOwnerSameAsDriver') })
  @ApiProperty({ description: '車主與駕駛人是否相同', example: true })
  isOwnerSameAsDriver: boolean;

  @ValidateIf((o) => o.isOwnerSameAsDriver === false)
  @IsBoolean({ message: TicketPattern.isTicketAssignedToDriver.message })
  @ApiProperty({ description: '是否歸責於駕駛', example: true })
  isTicketAssignedToDriver: boolean;

  @ValidateIf((o) => o.isOwnerSameAsDriver === false)
  @IsString({ message: ErrorUtil.invalidString('driverName') })
  @ApiProperty({ description: '駕駛姓名', example: '王小明' })
  driverName: string;

  @ValidateIf((o) => o.isOwnerSameAsDriver === false)
  @IsIdNumber({
    message: ErrorUtil.invalid('driverIdNo', 'must be a valid id number'),
  })
  @ApiProperty({ description: '駕駛身分證字號', example: 'A123456789' })
  driverIdNo: string;

  @IsOptional()
  @IsDate({ message: ErrorUtil.invalidDate('driverBirthdate') })
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty({
    description: '駕駛出生日期',
    example: '2022-01-01T00:00:00.000Z',
  })
  driverBirthdate: Date;

  @IsString({ message: ErrorUtil.invalidString('violation1Article') })
  @ApiProperty({ description: '違規條款1-條', example: 1 })
  violation1Article: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation1Item') })
  @ApiProperty({ description: '違規條款1-項', example: 1 })
  violation1Item: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation1Clause') })
  @ApiProperty({ description: '違規條款1-款', example: 1 })
  violation1Clause: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation2Article') })
  @ApiProperty({ description: '違規條款2-條', example: 1 })
  violation2Article: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation2Item') })
  @ApiProperty({ description: '違規條款2-項', example: 1 })
  violation2Item: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation2Clause') })
  @ApiProperty({ description: '違規條款2-款', example: 1 })
  violation2Clause: number;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation1Penalty') })
  @ApiProperty({ description: '違規罰則1', example: 'test' })
  violation1Penalty: string;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('violation2Penalty') })
  @ApiProperty({ description: '違規罰則2', example: 'test' })
  violation2Penalty: string;

  @IsOptional()
  @IsFine({
    message: ErrorUtil.invalid(
      'violationFine',
      'must be a valid violationFine',
    ),
  })
  @ApiProperty({ description: '違規罰金', example: 600 })
  violationFine: number;

  @IsEnum(ViolationFactTypeEnum, {
    message: ErrorUtil.invalid(
      'violationFactType',
      'must be a valid violation fact type',
    ),
  })
  @ApiProperty({
    description: '違規事實類型',
    example: ViolationFactTypeEnum.OTHER,
  })
  violationFactType: ViolationFactTypeEnum;

  // 類型選其他時，必填
  @ValidateIf((o) => o.violationFactType === ViolationFactTypeEnum.OTHER)
  @IsString({ message: ErrorUtil.invalidString('violationFact') })
  @ApiProperty({ description: '違規事實', example: '違規事實' })
  violationFact: string;

  @IsDate({ message: ErrorUtil.invalidDate('violateAt') })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({ description: '違規時間', example: '2022-01-01T00:00:00.000Z' })
  violateAt: Date;

  @Matches(TicketPattern.ticketNo.pattern, {
    message: TicketPattern.ticketNo.message,
  })
  @ApiProperty({ description: '罰單號碼', example: 'A123456789' })
  ticketNo: string;

  @Matches(TicketPattern.licensePlateNo.pattern, {
    message: TicketPattern.licensePlateNo.message,
  })
  @ApiProperty({ description: '車牌號碼', example: 'ABC-1234' })
  licensePlateNo: string;

  @IsEnum(VehicleTypeEnum, {
    message: ErrorUtil.invalid('vehicleType', 'must be a valid vehicle type'),
  })
  @ApiProperty({ description: '車輛類型', example: VehicleTypeEnum.MOTORCYCLE })
  vehicleType: VehicleTypeEnum;

  toTicket() {
    return plainToInstance(TicketDto, this);
  }

  static merge(
    original: TicketDto,
    updated: Partial<TicketUpdateReq>,
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
