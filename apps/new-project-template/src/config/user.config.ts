import process from 'node:process';

export default () => ({
  cacheExpiresDays: parseInt(process.env.USER_CACHE_EXPIRES_DAYS, 10) || 7,
  verifyCodeExpiresMinutes:
    Number(process.env.USER_VERIFY_CODE_EXPIRES_MINUTES) || 10,
});
