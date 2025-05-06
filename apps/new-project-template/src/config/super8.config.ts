import { registerAs } from '@nestjs/config';

export default registerAs('super8', () => ({
  username: process.env.SUPER8_USERNAME,
  password: process.env.SUPER8_PASSWORD,
  orgId: process.env.SUPER8_ORG_ID,
}));
