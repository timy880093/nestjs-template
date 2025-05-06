import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

@Module({
  // imports: [
  //   ClientsModule.register([
  //     {
  //       name: 'CACHE_MANAGER',
  //       transport: Transport.REDIS,
  //       options: {
  //         host: redisConfig().host,
  //         port: redisConfig().port,
  //       },
  //     },
  //   ]),
  // ],
  providers: [RedisService],
  controllers: [RedisController],
  exports: [RedisService],
})
export class RedisModule {}
