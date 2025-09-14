import { Module } from '@nestjs/common';
import { UsersRepository } from 'apps/new-project-template/src/modules/users/users.repository';

@Module({
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class PostgresModule {}
