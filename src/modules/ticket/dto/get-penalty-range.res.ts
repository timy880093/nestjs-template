export class GetPenaltyRangeRes {
  article: string; //條
  item: string; //項
  clause: string; //款
  fineRange: number[]; //罰鍰範圍
  serviceFeeRange: number[]; //預估服務費範圍

  constructor(data: Partial<GetPenaltyRangeRes>) {
    Object.assign(this, data);
  }
}
