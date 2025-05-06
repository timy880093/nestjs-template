import { Column, DataType, ForeignKey } from 'sequelize-typescript';
import { MvdisTicketModel } from '../entity/mvdis-ticket.model';

export class MvdisOwnerDto {
  id: number;
  userId: number;
  uid: string;
  birthday: string;
  createdAt: Date;
  updatedAt: Date;
  mvdisTickets?: MvdisTicketModel[];

  constructor(dto?: Partial<MvdisOwnerDto>) {
    Object.assign(this, dto);
  }
}
