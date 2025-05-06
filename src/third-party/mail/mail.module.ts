import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import mailConfig from './mail.config';

// https://www.nodemailer.com/message/attachments/
@Module({
  imports: [
    MailerModule.forRootAsync({
      // 已在 AppModule 注入 Global 的 ConfigModule，所以這裡不用再注入，直接使用 mailConfig()
      // 否則要加上以下兩行，並在 async func 加上 configService 注入
      // imports: [ConfigModule],
      // inject: [ConfigService],
      useFactory: async () => {
        // console.log('mailConfig: ', mailConfig());
        return {
          // transport: 'smtps://user@domain.com:pass@smtp.domain.com',
          transport: {
            host: mailConfig().host,
            port: mailConfig().port,
            secure: mailConfig().secure,
            auth: {
              user: mailConfig().username,
              pass: mailConfig().password,
            },
          },
          defaults: {
            // from: '"罰單申訴通知" <noreply@ticket.lawslog.com>',
            from: mailConfig().from,
          },
          template: {
            dir: mailConfig().templateDir,
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
