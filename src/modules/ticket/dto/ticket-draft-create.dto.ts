import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsEnum, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketDto } from './ticket.dto';
import { TicketPattern } from './ticket-pattern.const';
import { CityEnum } from '../enums/ticket.enum';

export class TicketDraftCreateDto {
  @IsBoolean({ message: TicketPattern.isTicketPaid.message })
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({
    default: false,
    required: false,
    description: '是否已支付罰單',
    example: false,
  })
  readonly isTicketPaid: boolean;

  @IsDate({ message: TicketPattern.expiresAt.message })
  @Transform(({ value }) => (value ? new Date(value) : null))
  @ApiProperty({
    required: true,
    description: '罰單到期日',
    example: '110/12/31 | 110-12-31',
  })
  readonly expiresAt: Date;

  @IsBoolean({ message: TicketPattern.isCompanyCar.message })
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({ required: true, description: '是否為公司車', example: true })
  readonly isCompanyCar: boolean;

  @ValidateIf((o) => o.isCompanyCar === true)
  @IsEnum(CityEnum, { message: TicketPattern.assignedOfficeCity.message })
  @ApiProperty({
    required: true,
    description: '應到案處所',
    example: CityEnum.TAIPEI,
  })
  assignedOfficeCity: CityEnum;

  @ValidateIf((o) => o.isCompanyCar === true)
  @IsBoolean({ message: TicketPattern.isTicketAssignedToDriver.message })
  @ApiProperty({ description: '是否歸責於駕駛', example: true })
  isTicketAssignedToDriver: boolean;

  static toTicketDto(dto: TicketDraftCreateDto, userId: number): TicketDto {
    const ticketDto = TicketDto.build(dto);
    ticketDto.userId = userId;
    ticketDto.isDraft = true;
    return ticketDto;
  }
}
