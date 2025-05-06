import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidateNested,
} from 'class-validator';
import { TicketPattern } from '../../ticket/dto/ticket-pattern.const';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TicketDto } from '../../ticket/dto/ticket.dto';
import { ValidateBirthdate } from '../../../common/validator/birthdate.constraints';
import { PhoneConstraints } from '../../../common/validator/phone.constraints';
import { UserPattern } from '../../users/dto/user-pattern.const';
import { UserDto } from '../../users/dto/user.dto';
import { SourceEnum } from '../../../common/dto/source.enum';
import { CityEnum } from '../../ticket/enums/ticket.enum';

@ValidateBirthdate()
export class CreateSimpleTicketReq {
  @IsArray()
  @ValidateNested({ each: true })
  @ApiProperty({
    description: '罰單資訊',
    example: [
      {
        ticketNo: 'A123456789',
        fileIds: [1, 2],
        isTicketPaid: false,
        expiresAt: '110/12/31',
      },
    ],
  })
  ticketInfos: TicketInfo[];

  @IsEnum(CityEnum, { message: TicketPattern.assignedOfficeCity.message })
  @ApiProperty({
    required: true,
    description: '應到案處所',
    example: CityEnum.TAIPEI,
  })
  assignedOfficeCity: CityEnum;

  @IsOptional()
  @IsString({ message: TicketPattern.licensePlateNo.message })
  @ApiProperty({ description: '車牌號碼', example: 'ABC-1234' })
  licensePlateNo: string;

  @Validate(PhoneConstraints, { message: UserPattern.phone.message })
  @ApiProperty({ description: '手機號碼', example: '0987654321' })
  phone: string;

  @IsEmail({}, { message: UserPattern.email.message })
  @ApiProperty({ description: '電子郵件', example: 'test@gmail.com' })
  email: string;

  @IsOptional()
  @IsString()
  // @IsEnum(RefEnum, { message: UserPattern.ref.message })
  @ApiProperty({ description: '網站導流', example: 'carmochi' })
  ref: string;

  toTickets(userId: number, orderId: number, source: SourceEnum): TicketDto[] {
    // 預設都不是草稿
    return this.ticketInfos.map(
      (t) =>
        new TicketDto({
          userId,
          orderId,
          ticketNo: t.ticketNo,
          ticketInfoFileIds: t.fileIds,
          isTicketPaid: t.isTicketPaid,
          expiresAt: t.expiresAt,
          isDraft: false,
          source,
        }),
    );
  }

  toUser(): UserDto {
    return new UserDto({
      phone: this.phone,
      email: this.email,
    });
  }
}

export class TicketInfo {
  @Matches(TicketPattern.ticketNo.pattern, {
    message: TicketPattern.ticketNo.message,
  })
  @ApiProperty({ description: '罰單號碼', example: 'A123456789' })
  ticketNo: string;

  // FIXME 檢查是否為空
  @IsArray({ message: TicketPattern.ticketInfoFileIds.message })
  @ApiProperty({
    description: '罰單資料 id',
    example: [1, 2],
  })
  fileIds: number[];

  @IsBoolean({ message: TicketPattern.isTicketPaid.message })
  @ApiProperty({
    description: '是否已繳納罰金',
    example: false,
  })
  isTicketPaid: boolean;

  @IsDate({ message: TicketPattern.expiresAt.message })
  @Transform(({ value }) => value && new Date(value))
  @ApiProperty({ description: '罰單到期日', example: '110/12/31 | 110-12-31' })
  expiresAt: Date;
}
