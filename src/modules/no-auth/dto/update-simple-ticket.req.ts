import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketDto } from '../../ticket/dto/ticket.dto';
import { ValidateBirthdate } from '../../../common/validator/birthdate.constraints';
import { VehicleTypeEnum } from '../../ticket/enums/ticket.enum';
import { ErrorUtil } from '../../../common/util';
import { IsIdNumberOrTaxId } from '../../../common/validator/id-number-or-tax-id.constraints';
import { OrderDto } from '../../ticket/dto/order.dto';
import { Transform } from 'class-transformer';

@ValidateBirthdate()
export class UpdateSimpleTicketReq {
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

  @IsEnum(VehicleTypeEnum, {
    message: ErrorUtil.invalid('vehicleType', 'must be a valid vehicle type'),
  })
  @ApiProperty({ description: '車輛類型', example: VehicleTypeEnum.MOTORCYCLE })
  vehicleType: VehicleTypeEnum;

  @IsOptional()
  @IsString({ message: ErrorUtil.invalidString('userStatement') })
  userStatement: string;

  @IsOptional()
  @IsArray({
    message: ErrorUtil.invalid('additionalAttachmentIds', 'must be an array'),
  })
  additionalAttachmentIds: number[];

  toTicket(): TicketDto {
    return new TicketDto({
      ownerName: this.ownerName,
      ownerIdNo: this.ownerIdNo,
      ownerBirthdate: this.ownerBirthdate,
      isOwnerSameAsDriver: this.isOwnerSameAsDriver,
      vehicleType: this.vehicleType,
    });
  }

  toOrder(): OrderDto {
    return new OrderDto({
      userStatement: this.userStatement,
      additionalAttachmentIds: this.additionalAttachmentIds,
      progress: null,
      userCompletedAt: new Date(),
    });
  }
}
