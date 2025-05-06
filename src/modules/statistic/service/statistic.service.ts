import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ErrorTypes } from '../../../common/dto/error-code.const';
import { TrackEventEnum } from '../../../common/dto/track-event.enum';
import { CommonException } from '../../../common/exception/common.exception';
import { DateUtil } from '../../../common/util';
import { RedisService } from '../../../third-party/redis/redis.service';
import {
  CreateEventLogReq,
  EventLogStatusEnum,
  GetTrackEventReq,
} from '../dto';
import { EventLogService } from './event-log.service';

@Injectable()
export class StatisticService {
  constructor(
    @InjectPinoLogger(StatisticService.name)
    private readonly logger: PinoLogger,
    private readonly redisService: RedisService,
    private readonly eventLogService: EventLogService,
  ) {}

  // 目前兩個都存，後續可用 db 資料取代 redis 的
  async recordTrackEvent(req: CreateEventLogReq) {
    try {
      // 存 DB
      await this.eventLogService.createEventLog({
        ...req,
        status: EventLogStatusEnum.SUCCESSFUL,
      });
      // 存 redis
      await this.redisService.addTrackEventTimes(req.event);
    } catch (e) {
      throw new CommonException(
        'recordSuccessEvent error',
        ErrorTypes.SERVER_ERROR,
        e,
      );
    }
  }

  // 回傳結果
  async recordSuccessEvent(event: TrackEventEnum) {
    return this.recordTrackEvent({
      event,
      status: EventLogStatusEnum.SUCCESSFUL,
    });
  }

  // 不須回傳結果
  async recordSuccessEventVoid(event: TrackEventEnum) {
    try {
      void this.recordTrackEvent({
        event,
        status: EventLogStatusEnum.SUCCESSFUL,
      });
    } catch (e) {
      this.logger.warn(
        { event, error: e.message },
        'recordSuccessEventVoid error: ',
      );
    }
  }

  async getEventTimesFromCache({
    startDate,
    endDate,
  }: GetTrackEventReq): Promise<Record<string, any>[]> {
    const keyPrefix = 'event';
    let results: { [x: string]: Record<string, string> }[];
    if (startDate || endDate) {
      const keys: string[] = [];
      let start = DateUtil.twDayjs(startDate) || DateUtil.twDayjs();
      const end = DateUtil.twDayjs(endDate) || DateUtil.twDayjs();
      // this.logger.debug({ start, end }, 'getAllEventTimes date range: ');
      while (start.isBefore(end) || start.isSame(end)) {
        keys.push(`${keyPrefix}:${start.format('YYYY-MM-DD')}`);
        start = start.add(1, 'day');
      }
      // this.logger.debug({ keys }, 'getAllEventTimes range keys: ');
      results = await this.redisService.getHashValuesByKeys(keyPrefix, keys);
      // this.logger.debug({ results }, 'getAllEventTimes range result: ');
    } else {
      results = await this.redisService.getHashValuesByKeyPrefix(keyPrefix);
      // this.logger.debug({ results }, 'getAllEventTimes all result: ');
    }
    const sumResult = await this.redisService.sumHashValues(results);
    const result = results.map((item) => {
      const [[date, values]] = Object.entries(item);
      values['date'] = date;
      return values;
    });
    // this.logger.debug({ results }, 'getAllEventTimes all result: ');
    // this.logger.debug({ sumResult }, 'getAllEventTimes sum result: ');
    result.push(sumResult);
    return result;
  }
}
