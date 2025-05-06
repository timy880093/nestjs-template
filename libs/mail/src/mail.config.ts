import { join } from 'path';

export default () => {
  const secure = Boolean(process.env.MAIL_SECURE) || false;
  return {
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    from: process.env.MAIL_FROM,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    templateDir: process.env.NODE_ENV?.toString().endsWith('local')
      ? join(process.cwd(), 'src/third-party/mail/templates')
      : join(__dirname, 'third-party/mail/templates'),
  };
};
