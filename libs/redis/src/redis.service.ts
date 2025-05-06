import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import _ from 'lodash';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorTypes } from '@app/common/dto/error-code.const';
import { RedisGroupEnum } from '@app/common/dto/redis-group.enum';
import { TrackEventEnum } from '@app/common/dto/track-event.enum';
import { RedisException } from '@app/common/exception/redis.exception';
import { DateUtil } from '@app/common/util';
import redisConfig from '../../../apps/new-project-template/src/config/redis.config';

// import { err } from 'pino-std-serializers';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(
    @InjectPinoLogger(RedisService.name) private logger: PinoLogger,
  ) {}

  async onModuleInit() {
    this.client = new Redis({
      host: redisConfig().host,
      port: redisConfig().port,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        this.logger.debug(`Redis retry connect times: ${times}!`);
        return Math.min(times * 50, 2000);
      },
    });
    this.client.on('connect', () => {
      this.logger.info('Redis connected!');
    });
    this.client.on('error', (error) => {
      this.logger.error({ error }, 'Redis error: ');
    });
    this.client.on('end', () => {
      this.logger.warn('Redis connection closed');
    });
  }

  onModuleDestroy() {
    this.client.quit();
  }

  async isRedisConnected(): Promise<boolean> {
    return this.client?.status === 'ready';
  }

  async checkRedisConnected(): Promise<void> {
    let isReady = false;
    let retry = 0;
    do {
      if (retry > 0)
        this.logger.info(`Redis is not connected, retrying ${retry}`);
      isReady = await this.isRedisConnected();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retry++;
    } while (isReady === false && retry < 30);
    if (isReady === false) throw new Error('Redis is not connected');
  }

  async get(group: string, key: string): Promise<string | null> {
    return this.client.get(this.groupKey(group, key));
  }

  async set(
    group: string,
    key: string,
    value: any,
    ttl?: number,
  ): Promise<boolean> {
    const stringValue = value && value.toString();
    const groupKey = this.groupKey(group, key);
    const result = ttl
      ? await this.client.set(groupKey, stringValue, 'EX', ttl)
      : await this.client.set(groupKey, stringValue);
    return result === 'OK';
  }

  async hgetall(
    group: string,
    key: string,
  ): Promise<Record<string, any> | null> {
    const result = await this.client.hgetall(this.groupKey(group, key));
    return Object.keys(result).length === 0 ? null : result;
  }

  // async hgetallList(group: string): Promise<string[]> {
  //     let cursor = '0';
  //     let users: UserDto[] = [];
  //
  //     do {
  //         const result = await this.client.hscan(`${group}:`, cursor);
  //         cursor = result[0];
  //         users.push(...result[1]);
  //     }
  // }

  async hset(
    group: string,
    id: string,
    data: Record<string, any>,
    expiredSecond?: number,
  ): Promise<string> {
    const key = this.groupKey(group, id);
    await this.client.hset(key, {
      ...data,
      cacheCreatedAt: DateUtil.zoneDayjs().toDate(),
      cacheExpiresAt: DateUtil.zoneDayjs()
        .add(expiredSecond, 'second')
        .toDate(),
    });
    if (expiredSecond) await this.client.expire(key, expiredSecond);
    return key;
  }

  async hincrby(key: string, field: string): Promise<number> {
    const value = await this.client.hget(key, field);
    if (!value) await this.client.hset(key, field, 0);
    return this.client.hincrby(key, field, 1);
  }

  async hget(key: string, field: string): Promise<string> {
    return this.client.hget(key, field);
  }

  async getHashValuesByKeyPrefix(
    keyPrefix: string,
  ): Promise<{ [x: string]: Record<string, any> }[]> {
    const keys = await this.client.keys(`${keyPrefix}:*`);
    // this.logger.debug({ keys }, 'getAllHashValues keys: ');
    return this.getHashValuesByKeys(keyPrefix, keys);
  }

  /*
   * 透過 keys 取得哈希值
   * 結構：["2025-01-01": { "event1": "1", "event2": "2" }]
   */
  async getHashValuesByKeys(
    keyPrefix: string,
    keys: string[],
  ): Promise<{ [x: string]: Record<string, string> }[]> {
    const promise = keys.map(async (k) => {
      const result = await this.client.hgetall(k);
      return !_.isEmpty(result) && { [k.replace(`${keyPrefix}:`, '')]: result };
    });
    const results = await Promise.all(promise);
    // 過濾空的結果
    return results.filter((r) => r);
  }

  async sumHashValues(
    data: { [x: string]: Record<string, string> }[],
  ): Promise<Record<string, any>> {
    // 先攤平日期
    const flat = data.flatMap((d) => Object.values(d));
    // 合併所有哈希的資料次數
    return flat.reduce(
      (acc, current) => {
        for (const [field, value] of Object.entries(current)) {
          acc[field] = acc[field]
            ? acc[field] + parseInt(value)
            : parseInt(value);
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async getHashValues(key: string): Promise<string[]> {
    const values = await this.client.hgetall(key);
    return Object.values(values);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field);
  }

  async getEventsByDateRange(
    event: TrackEventEnum,
    startDate?: string,
    endDate?: string,
  ): Promise<Record<string, Record<string, number>>> {
    const result: Record<string, Record<string, number>> = {};
    const keys: string[] = [];

    if (!startDate || !endDate) {
      // 如果沒有日期範圍，取得所有 event: 開頭的 key
      const stream = this.client.scanStream({
        match: `${event.toString()}:*`,
      });

      await new Promise((resolve, reject) => {
        stream.on('data', (resultKeys: string[]) => {
          keys.push(...resultKeys);
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    } else {
      // 有日期範圍時的處理邏輯
      const start = DateUtil.twDayjs(startDate);
      const end = DateUtil.twDayjs(endDate);
      let current = start;

      while (current.isBefore(end) || current.isSame(end)) {
        keys.push(`${event}:${current.format('YYYY-MM-DD')}`);
        current = current.add(1, 'day');
      }
    }

    if (keys.length === 0) {
      return result;
    }

    // 批量獲取事件數據
    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.hgetall(key));
    const responses = await pipeline.exec();

    // 處理回應數據
    keys.forEach((key, index) => {
      const date = key.split(':')[1];
      const response = responses[index][1];

      if (response && Object.keys(response).length > 0) {
        result[date] = {};
        for (const [event, count] of Object.entries(response)) {
          result[date][event] = parseInt(count as string, 10);
        }
      }
    });

    return result;
  }

  // async pushList(group: string, key: string, value: any): Promise<number> {
  //   this.logger.debug({ group, key, value }, 'pushList: ');
  //   return this.client.lpush(this.groupKey(group, key), value);
  // }
  //
  // // FIXME: 目前只限用於 一層 group:key 的情境
  // async getListElements(group: string): Promise<RedisDto[]> {
  //   const keys = await this.client.keys(this.groupKey(group, '*'));
  //   const result: RedisDto[] = [];
  //
  //   await Promise.all(
  //     keys.map(async (groupKey) => {
  //       const key = groupKey.split(':')[1];
  //       const operations = await this.client.lrange(groupKey, 0, -1);
  //       operations.forEach((value) => {
  //         result.push({ key, value });
  //       });
  //     }),
  //   );
  //   return result;
  // }

  async del(group: string, key: string): Promise<number> {
    return this.client.del(this.groupKey(group, key));
  }

  async setJson(
    group: string,
    key: string,
    data: Record<string, any>,
  ): Promise<void> {
    await this.client.call(
      'JSON.SET',
      this.groupKey(group, key),
      '$',
      JSON.stringify(data),
    );
  }

  async getJson(
    group: string,
    key: string,
  ): Promise<Record<string, any> | null> {
    const data = await this.client.call('JSON.GET', this.groupKey(group, key));
    return JSON.parse(data as string);
  }

  async delGroup(group: string): Promise<void> {
    const stream = this.client.scanStream({
      match: `${group}:*`,
    });
    stream.on('data', (keys) => {
      if (keys.length) {
        this.client.del(...keys);
      }
    });
    stream.on('end', () => {
      this.logger.info(`Group ${group} deleted`);
    });
    stream.on('error', (err) => {
      this.logger.error(`Error deleting group ${group}: ${err.message}`);
    });
  }

  // ttl: 秒
  async acquireLock(group: string, key: string, ttl: number): Promise<boolean> {
    for (let i = 0; i < 5; i++) {
      // 重試 5 次
      const result = await this.client.set(
        this.groupKey(group, key),
        'locked',
        'EX',
        ttl,
      );
      if (result === 'OK') {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new RedisException('acquireLock failed');
  }

  async releaseLock(group: string, key: string): Promise<number> {
    return this.del(group, key);
  }

  async exists(group: string, key: string): Promise<number> {
    return this.client.exists(this.groupKey(group, key));
  }

  private groupKey(group: string, ...key: string[]): string {
    if (!key || key.length === 0) throw new RedisException('key is required');
    const keyString = key
      .filter((k) => k)
      .map((k) => k.toString())
      .join(':');
    return `${group}:${keyString}`;
  }

  // 錯誤不拋出，只記錄
  async addTrackEventTimes(event: TrackEventEnum): Promise<number> {
    const date = DateUtil.twDayjs().toISOString().slice(0, 10);
    const key = `${RedisGroupEnum.TRACK_EVENT}:${date}`;
    // await this.redisService.acquireLock(group, key, 5);
    try {
      // const times = await this.redisService.get(group, key);
      // const newTimes = Number(times) + 1;
      // await this.redisService.set(group, key, newTimes);
      return this.hincrby(key, String(event));
      // return newTimes;
    } catch (e) {
      throw new RedisException(
        'addTrackEventTimes error',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  async renameHashKey(
    prefix: string,
    oldKey: string,
    newKey: string,
  ): Promise<string[]> {
    const modifiedHashes: string[] = [];
    let cursor = '0';

    // 使用 SCAN 命令查找所有以 event: 開頭的哈希
    let scanResult;
    do {
      scanResult = await this.client.scan(
        cursor,
        'MATCH',
        `${prefix}*`,
        'COUNT',
        100,
      );
      cursor = scanResult[0]; // 更新游標
      const keys = scanResult[1];

      for (const key of keys) {
        // 檢查哈希中是否存在 oldKey
        const exists = await this.client.hexists(key, oldKey);
        if (exists) {
          // 獲取 oldKey 的值
          const value = await this.client.hget(key, oldKey);
          // 設置新鍵
          await this.client.hset(key, newKey, value);
          // 刪除舊鍵
          await this.client.hdel(key, oldKey);
          // 將修改的哈希名稱添加到返回列表
          modifiedHashes.push(key);
        }
      }
    } while (cursor !== '0'); // 繼續直到游標為 0

    this.logger.debug({ modifiedHashes }, 'renameHashKey modifiedHashes: ');
    return modifiedHashes; // 返回所有被修改的哈希名稱
  }
}
