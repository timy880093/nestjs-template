import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserModel } from './entity/user.model';
import { RedisModule } from '../../third-party/redis/redis.module';
import { UsersRepository } from './users.repository';
import { SmsModule } from '../../third-party/sms/sms.module';
import { MailLogModule } from '../mail-log/mail-log.module';

@Module({
  imports: [
    SequelizeModule.forFeature([UserModel]),
    RedisModule,
    MailLogModule,
    SmsModule,
  ],
  providers: [UsersService, UsersRepository],
  exports: [SequelizeModule, UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
