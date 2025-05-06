import { DateUtil } from '@app/common/util/date.util';

export class TokenRes {
  accessToken: string;
  expiresIn: string;
  expiresAt: Date;

  constructor(accessToken: string, expiresIn: string, expiresAt: Date) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
    this.expiresAt = expiresAt;
  }

  static create(accessToken: string, expiresIn: string) {
    const expiresAt = DateUtil.addDateIncrement(expiresIn);
    return new TokenRes(accessToken, expiresIn, expiresAt);
  }
}
