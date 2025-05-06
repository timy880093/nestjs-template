import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  e8dUid: process.env.E8D_UID,
  e8dPwd: process.env.E8D_PWD,
}));
