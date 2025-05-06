import { MailModule } from '@app/mail';
import { RedisModule } from '@app/redis/redis.module';
import { SmsModule } from '@app/sms/sms.module';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './entity/user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    RedisModule,
    MailModule,
    SmsModule,
  ],
  providers: [UsersService, UsersRepository],
  exports: [SequelizeModule, UsersService, UsersRepository],
  controllers: [UsersController],
})
export class UsersModule {}
