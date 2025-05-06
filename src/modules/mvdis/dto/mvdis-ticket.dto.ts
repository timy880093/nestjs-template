export class MvdisTicketDto {
  id: number;
  ownerId: number;
  adDate: number;
  status: boolean;
  items: number;
  vilDate: string;
  vilDateStr: string;
  vilFact: string;
  arrivedDate: string;
  arrivedDateStr: string;
  vilTicket: string;
  plateNo: string;
  vehKind: string;
  payment: number;
  penalty: number;
  dmv: string;
  respTp: string;
  location: string;
  law: string;
  office: string;

  constructor(dto?: Partial<MvdisTicketDto>) {
    Object.assign(this, dto);
  }
}
