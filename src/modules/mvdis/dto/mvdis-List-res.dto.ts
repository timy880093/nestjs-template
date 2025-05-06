import { MvdisOwnerModel } from '../entity/mvdis-owner.model';
import { MvdisTicketModel } from '../entity/mvdis-ticket.model';

export class MvdisListResDto {
  id: number;
  uid: string;
  mvdisTickets: MvdisTicketResDto[];

  constructor(dto?: Partial<MvdisOwnerModel>) {
    this.id = dto.id;
    this.uid = maskUid(dto.uid);
    this.mvdisTickets = dto.mvdisTickets.map((t) => new MvdisTicketResDto(t));
  }
}

export class MvdisTicketResDto {
  id: number;
  adDate: number;
  status: boolean;
  items: number;
  vilDate: string; //違規日期
  vilDateStr: string; //違規日期
  vilFact: string; //違規事實
  arrivedDate: string; //到案日期
  arrivedDateStr: string; //到案日期
  vilTicket: string; //罰單編號
  plateNo: string; //車牌號碼
  vehKind: string;
  payment: number; //已繳金額
  penalty: number; //罰金
  dmv: string;
  respTp: string; //肇責比例分配
  location: string; //違規地點
  law: string; //違規法條
  office: string; //監理單位

  constructor(dto?: Partial<MvdisTicketModel>) {
    Object.assign(this, dto.dataValues);
  }
}

function maskUid(uid: string) {
  const head = uid.slice(0, 3);
  const tail = uid.slice(-2);
  return head + '***' + tail;
}
