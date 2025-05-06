import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from '@app/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import postgresConfig from './config/postgres.config';
import authConfig from '@app/auth/auth.config';
import { UploadModule } from './modules/upload/upload.module';
import { MailModule } from '@app/mail/mail.module';
import { PaymentModule } from '@app/payment/payment.module';
import redisConfig from './config/redis.config';
import { RedisModule } from '@app/redis/redis.module';
import { RecognitionModule } from './modules/recognition/recognition.module';
import mailConfig from '@app/mail/mail.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { getLoggerConfig } from './config/logger.config';
import { MqModule } from '@app/mq/mq.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/common/guard/jwt-auth.guard';
import { TaskModule } from './modules/task/task.module';
import { InvoiceModule } from '@app/invoice/invoice.module';
import taskConfig from './config/task.config';
import smsConfig from './config/sms.config';

import { MqConsumerModule } from './modules/mq-consumer/mq-consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        postgresConfig,
        redisConfig,
        authConfig,
        mailConfig,
        taskConfig,
        smsConfig,
      ],
      envFilePath: appConfig().envFile,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: postgresConfig().host,
      port: postgresConfig().port,
      username: postgresConfig().user,
      password: postgresConfig().password,
      database: postgresConfig().database,
      autoLoadModels: true, // 自動載入所有 model，但仍需在各自使用的 module import model
      synchronize: false, // 以 model 定義的 schema 自動建立 table，通常開發環境才用
      define: {
        underscored: true, // model 的屬性(camel)，自動對應 db 欄位(under_line)
      },
      logging: postgresConfig().logging,
    }),
    // BullModule.forRootAsync({
    //   useFactory: () => ({
    //     connection: {
    //       host: redisConfig().host,
    //       port: redisConfig().port,
    //     },
    //   }),
    // }),
    // BullModule.registerQueue({
    //   name: 'admin',
    // }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRootAsync(getLoggerConfig(appConfig())),
    UsersModule,
    AuthModule,
    UploadModule,
    RecognitionModule,
    TaskModule,
    MailModule,
    RedisModule,
    MqModule,
    MqConsumerModule,
    InvoiceModule,
    PaymentModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
