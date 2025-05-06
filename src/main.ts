import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import appConfig from './config/app.config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import session from 'express-session';
import passport from 'passport';
import { CommonHttpExceptionFilter } from './common/filter/common-http-exception.filter';
import { ValidationExceptionFilter } from './common/filter/validation-exception.filter';
import * as fs from 'node:fs';
import { Logger, PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const pinoLogger = await app.resolve(PinoLogger);
  pinoLogger.logger.debug({ appConfig: appConfig() }, 'appConfig: ');
  // app.useGlobalGuards(new JwtAuthGuard());
  app.enableCors({
    origin: [
      'https://*.retool.com',
      'https://app.xn--b2r864ev6gb9k.com',
      'https://ticket-web.test.suodata.com',
      'https://editor-bot.no8.io',
      'http://localhost:3007',
      'http://localhost:3000',
    ],
    // methods: ['GET', 'POST'],
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(pinoLogger));
  app.useGlobalFilters(
    // new GlobalExceptionsFilter(pinoLogger),
    new CommonHttpExceptionFilter(pinoLogger),
    new ValidationExceptionFilter(pinoLogger),
  );
  // passport oauth2 須啟用 session
  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // swagger
  const config = new DocumentBuilder()
    .setTitle('Ticket API')
    .setDescription('The ticket API description')
    .setVersion('1.0')
    .addTag('ticket')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));

  await app.listen(appConfig().port);
}

bootstrap();
