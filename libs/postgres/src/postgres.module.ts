import { Module } from '@nestjs/common';
import { UsersRepository } from '@app/postgres/common/users.repository';

@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class PostgresModule {}
