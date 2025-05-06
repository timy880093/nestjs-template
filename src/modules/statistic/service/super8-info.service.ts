import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Super8InfoRepository } from '../repository';
import axios from 'axios';
import { CommonException } from '../../../common/exception/common.exception';
import super8Config from '../../../config/super8.config';
import { GetSuper8TagReq, GetSuper8TagRes, UpsertSuper8TagReq } from '../dto';
import _ from 'lodash';
import { CommonUtil } from '../../../common/util';
import { RedisService } from '../../../third-party/redis/redis.service';

@Injectable()
export class Super8InfoService {
  private readonly username: string;
  private readonly password: string;
  private readonly orgId: string;
  private readonly loginUrl = 'https://api-next.no8.io/user/login';
  private readonly getCustomersUrl =
    'https://api-next.no8.io/broadcast/getCustomers';

  constructor(
    @InjectPinoLogger(Super8InfoService.name)
    private readonly logger: PinoLogger,
    private readonly redisService: RedisService,
    private readonly super8RefRepository: Super8InfoRepository,
  ) {
    this.username = super8Config().username;
    this.password = super8Config().password;
    this.orgId = super8Config().orgId;
  }

  async getSuper8RefTags(dto: GetSuper8TagReq): Promise<GetSuper8TagRes> {
    this.logger.debug({ dto }, 'GetSuper8RefTags: ');
    const { lineUid, originalDisplayName } = dto;

    let isLocked = false;
    try {
      isLocked = await this.redisService.acquireLock('super8', lineUid, 30); //30秒鎖定
      // 先查 DB
      const info = await this.super8RefRepository.findOne({ lineUid });
      if (info) {
        const result = { refTag: info.refTag };
        this.logger.debug(result, 'GetSuper8RefTags from db');
        return result;
      }
      // 查不到再去 super8 取
      const [result, _] = await this.fetchCustomersAndSave(
        new UpsertSuper8TagReq({
          id: info?.id,
          lineUid,
          originalDisplayName,
        }),
      );

      return { refTag: result?.refTag };
    } catch (e) {
      this.logger.error(e, 'GetSuper8RefTags error');
      throw new CommonException('GetSuper8RefTags error: ' + e.message);
    } finally {
      if (isLocked) await this.redisService.releaseLock('super8', lineUid);
    }
  }

  private async loginSuper8(
    username: string,
    password: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.loginUrl,
        {
          username,
          password,
          _method: 'GET',
        },
        {
          headers: {
            origin: 'https://console.no8.io',
          },
        },
      );
      return response.data.sessionToken;
    } catch (e) {
      throw new CommonException('login failed: ' + e.message);
    }
  }

  private async getCustomersApi(
    sessionToken: string,
    originalDisplayName: string,
    orgId: string,
  ): Promise<any> {
    const response = await axios.post(
      this.getCustomersUrl,
      {
        where: {
          originalDisplayName,
          displayName: null,
          tagDensity: [],
          partnerTag: [],
          platforms: [],
          cellPhone: null,
          email: null,
          friendship: null,
          inboxes: [],
          gender: [],
          orgId,
        },
        select: ['joinedAt', 'lastMessageAt', 'friendship', 'conversation'],
        options: {
          isNoTagCustomer: false,
        },
        skip: 0,
        limit: 100,
        sliceTagsCount: 12,
      },
      {
        headers: {
          _sessiontoken: sessionToken,
        },
      },
    );
    const customers = response.data?.result?.customers;
    return CommonUtil.isArray(customers) && customers[0]; // 返回客戶資料
  }

  async fetchCustomersAndSave(dto: UpsertSuper8TagReq) {
    // 登入
    const sessionToken = await this.loginSuper8(this.username, this.password);
    // 取客戶資料
    const customer = await this.getCustomersApi(
      sessionToken,
      dto.originalDisplayName,
      this.orgId,
    );
    if (_.isEmpty(customer))
      throw new CommonException('fetchCustomers failed: result is empty');
    const refTag = customer.tags?.find((tag) => tag && tag.startsWith('ref-'));

    // 存 DB
    const dbResult = await this.super8RefRepository.upsert({
      ...dto,
      refTag,
    });
    this.logger.debug('fetchCustomersAndSave success');

    return dbResult;
  }
}
