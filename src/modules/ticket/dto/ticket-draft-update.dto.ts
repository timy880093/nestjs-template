import { TicketUpdateReq } from './ticket-update.req';
import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { ErrorUtil } from '../../../common/util/error.util';

export class TicketDraftUpdateDto extends PartialType(TicketUpdateReq) {
  @IsString({ message: ErrorUtil.invalidString('ticketNo') })
  ticketNo: string;
  @IsString({ message: ErrorUtil.invalidString('licensePlateNo') })
  licensePlateNo: string;
  @IsString({ message: ErrorUtil.invalidString('ownerIdNo') })
  ownerIdNo: string;
  @IsString({ message: ErrorUtil.invalidString('driverIdNo') })
  driverIdNo: string;
}
