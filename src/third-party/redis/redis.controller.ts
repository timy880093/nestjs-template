import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AdminGuard } from '../../common/guard/admin.guard';

@Controller('redis')
@UseGuards(AdminGuard)
export class RedisController {
  private readonly group = 'redis';

  constructor(private readonly redisService: RedisService) {}

  @Post('set/:key/:value/')
  async set(
    @Param('key') key: string,
    @Param('value') value: string,
  ): Promise<boolean> {
    return this.redisService.set(this.group, key, value);
  }

  @Get('get/:key')
  async get(@Param('key') key: string): Promise<string | null> {
    return this.redisService.get(this.group, key);
  }

  @Post('lock/:key/:ttl')
  async lock(
    @Param('key') key: string,
    @Param('ttl') ttl: number,
  ): Promise<boolean> {
    return this.redisService.acquireLock(this.group, key, ttl);
  }

  @Post('unlock/:key')
  async unlock(@Param('key') key: string): Promise<number> {
    return this.redisService.releaseLock(this.group, key);
  }

  @Post('rename-hash-key')
  async renameHashKey(
    @Body('hashKey') hashKey: string,
    @Body('oldKey') oldKey: string,
    @Body('newKey') newKey: string,
  ): Promise<string[]> {
    return this.redisService.renameHashKey(hashKey, oldKey, newKey);
  }
}
