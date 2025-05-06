import { IsNumber, IsString } from 'class-validator';

export class GetSuper8TagReq {
  @IsString()
  readonly lineUid: string;
  @IsString()
  readonly originalDisplayName: string;
}

export class UpsertSuper8TagReq {
  @IsNumber()
  readonly id?: number;
  @IsString()
  readonly lineUid: string;
  @IsString()
  readonly originalDisplayName: string;
  @IsString()
  tag: string;

  constructor(data: Partial<UpsertSuper8TagReq>) {
    Object.assign(this, data);
  }
}

export interface GetSuper8TagRes {
  readonly refTag: string;
}
