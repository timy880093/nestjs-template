import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../../../apps/new-project-template/src/modules/users/users.module';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LineService } from './line.service';
import { HttpModule } from '@nestjs/axios';
import { LineStrategy } from './passport/line.strategy';
import { MailLogModule } from '../../../apps/new-project-template/src/modules/mail-log/mail-log.module';

@Module({
  imports: [
    UsersModule,
    MailLogModule,
    PassportModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [
    AuthService,
    LineService,
    LocalStrategy,
    JwtStrategy,
    LineStrategy,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
