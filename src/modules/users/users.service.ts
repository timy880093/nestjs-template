import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserCreateDto } from './dto/user-create.dto';
import { UserDto } from './dto/user.dto';
import { UserException } from '../../common/exception/user.exception';
import { Op, Transaction } from 'sequelize';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../third-party/redis/redis.service';
import userConfig from '../../config/user.config';
import { UsersRepository } from './users.repository';
import { CommonUtil, ErrorUtil } from '../../common/util';
import { RedisGroupEnum } from '../../common/dto/redis-group.enum';
import { SendMailTemplateReq } from '../../third-party/mail/dto/send-mail-template.req';
import { SendSmsReq } from '../../third-party/sms/send-sms.req';
import { SmsService } from '../../third-party/sms/sms.service';
import { UserFindOrCreateDto } from './dto/user-find-or-create.dto';
import { RoleEnum } from './dto/role.enum';
import { MailLogService } from '../mail-log/mail-log.service';
import { MailLogCategory } from '../mail-log/dto/mail-log.enum';
import _ from 'lodash';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  // private readonly userRepository2: GenericRepository;
  private readonly cacheExpiresSeconds: number;
  private readonly verifyCodeExpiresSeconds: number;

  constructor(
    @InjectPinoLogger(UsersService.name)
    private readonly logger: PinoLogger,
    private readonly userRepository: UsersRepository,
    private readonly redisService: RedisService,
    private readonly mailLogService: MailLogService,
    private readonly smsService: SmsService,
  ) {
    this.cacheExpiresSeconds = userConfig().cacheExpiresDays * 24 * 60 * 60;
    this.verifyCodeExpiresSeconds = userConfig().verifyCodeExpiresMinutes * 60;
    // this.userRepository2 = new GenericRepository(this.userRepository);
  }

  // 必須等 redis 連線成功後才能繼續
  async onApplicationBootstrap(): Promise<void> {
    await this.genUuidIfNull();
  }

  // 2024/11/22 確保每個 user 都有 uuid，後續可移除
  private async genUuidIfNull() {
    const userDtos = await this.findAll({ uuid: null });
    const promise = userDtos
      .filter((u) => !u.uuid)
      .map(async (u) => this.update(u.id, { uuid: CommonUtil.genUuid() }));
    const results = await Promise.all(promise);
    if (CommonUtil.isArray(results))
      this.logger.debug(`gen uuid for id: ${results.map((u) => u.id)}`);
  }

  // async onApplicationBootstrap(): Promise<void> {
  //   await this.redisService.checkRedisConnected();
  //   const userDtos = await this.findAll();
  //   await this.redisService.delGroup('user');
  //   for (const userDto of userDtos) {
  //     const newUser = { ...userDto, cachedAt: new Date() };
  //     await this.redisService.hset('user', userDto.id, newUser);
  //     this.logger.debug(`User data has been cached: ${userDto.id}`);
  //   }
  //   // const promise = userDtos.map(async (userDto) => {
  //   //   const newUser = { ...userDto, cachedAt: new Date() };
  //   //   return this.redisService.hset('user', userDto.id, newUser);
  //   // });
  //   // await Promise.all(promise);
  //   this.logger.info(`User data has been cached: ${userDtos.length} records`);
  // }

  async findAll(dto?: Partial<UserDto>, or?: any): Promise<UserDto[]> {
    return this.userRepository.findAll(dto, or);
  }

  async findOneLikeUsername(username: string): Promise<UserDto | undefined> {
    return (
      username &&
      (await this.userRepository.findOne({
        username: { [Op.iLike]: username },
      }))
    );
  }

  async findOneLikeEmail(email: string): Promise<UserDto | undefined> {
    return (
      email &&
      (await this.userRepository.findOne({
        email: { [Op.iLike]: email },
      }))
    );
  }

  async findOneByLineUid(lineUid: string): Promise<UserDto | undefined> {
    return lineUid && (await this.userRepository.findOne({ lineUid }));
  }

  async findOneById(id: number): Promise<UserDto> {
    let result = await this.getUserCache(id);
    if (result) return result;
    // FIXME 是否都要用封裝好的 GenericRepository
    result = await this.userRepository.findOne({ id });
    await this.setUserCache(result);
    this.logger.debug({ result }, `Get user table: ${id}`);
    return result;
  }

  async create(
    userDto: Partial<UserDto>,
    transaction?: Transaction,
  ): Promise<UserDto> {
    if (!userDto.role) userDto.role = RoleEnum.USER;
    if (!userDto.uuid) userDto.uuid = CommonUtil.genUuid();
    this.logger.debug({ userDto }, 'Create user: ');
    return this.userRepository.create(userDto, transaction);
  }

  async createByGeneric(userCreateDto: UserCreateDto): Promise<UserDto> {
    const userDto = await UserCreateDto.toUserDto(userCreateDto);
    await this.checkUser(userDto);
    return this.create(userDto);
  }

  async updateProfile(
    id: number,
    userUpdateDto: UserUpdateDto,
  ): Promise<UserDto> {
    // const userDto = await UserUpdateDto.toUserDto(id, userUpdateDto);
    const userDto = await userUpdateDto.toUserDto(id);
    await this.checkUser(userDto);
    return this.updateWithCache(id, userDto);
  }

  async updateWithCache(id: number, dto: Partial<UserDto>): Promise<UserDto> {
    const result = await this.userRepository.update({ id }, dto);
    await this.delUserCache(id);
    return result;
  }

  async update(id: number, dto: Partial<UserDto>): Promise<UserDto> {
    return this.userRepository.update({ id }, dto);
  }

  async updateLastLoginAt(id: number): Promise<UserDto> {
    return this.userRepository.update({ id }, { lastLoginAt: new Date() });
  }

  async checkUser(userDto: UserDto) {
    const orCondition = [];
    if (userDto.username) orCondition.push({ username: userDto.username });
    if (userDto.email) orCondition.push({ email: userDto.email });
    if (userDto.phone) orCondition.push({ phone: userDto.phone });

    const results = await this.userRepository.findAll(null, orCondition);

    results
      .filter((user) => (userDto.id ? user.id !== userDto.id : true))
      .forEach((userModel) => {
        if (userModel.username === userDto.username)
          throw new BadRequestException(ErrorUtil.duplicated('username'));
        if (userModel.email === userDto.email)
          throw new BadRequestException(ErrorUtil.duplicated('email'));
        if (userModel.isPhoneVerified && userModel.phone === userDto.phone)
          throw new BadRequestException(ErrorUtil.duplicated('phone'));
      });
    return true;
  }

  async remove(id: number): Promise<number> {
    try {
      const result = this.userRepository.remove({ id });
      await this.delUserCache(id);
      return result;
    } catch (e) {
      throw new UserException(`Failed to remove user id ${id}: ${e.message}`);
    }
  }

  async restore(id: number): Promise<UserDto> {
    return this.userRepository.restore(id);
  }

  async setUserCache(userDto: UserDto): Promise<string> {
    return this.redisService.hset(
      'user',
      userDto.id?.toString(),
      userDto,
      this.cacheExpiresSeconds,
    );
  }

  async getUserCache(id: number): Promise<UserDto> {
    const result = await this.redisService.hgetall('user', id?.toString());
    if (!_.isEmpty(result)) {
      const user = new UserDto(result);
      this.logger.debug({ user2: user }, `Get user cache: ${id}: `);
      return user;
    }
    return;
    // const userDto = await this.userRepository.findOne({ id });
    // await this.setUserCache(userDto);
    // this.logger.debug({ userDto }, `set user cache and return: ${id}`);
    // return userDto;
  }

  async delUserCache(id: number): Promise<number> {
    return this.redisService.del('user', id?.toString());
  }

  async sendPhoneCode(phone: string) {
    const code = this.genVerifyCode().toString();
    const isCached = await this.redisService.set(
      RedisGroupEnum.PHONE_VERIFY,
      phone,
      code,
      this.verifyCodeExpiresSeconds,
    );
    if (isCached) {
      await this.smsService.sendText(
        new SendSmsReq({
          phones: [phone],
          subject: '【罰單申訴會員驗證】',
          text: `[罰單申訴] 驗證碼：${code}，請於 10 分鐘內輸入。`,
        }),
      );
      this.logger.debug(
        `Set verify code to redis and send sms: ${phone}: ${code}`,
      );
    } else throw new UserException(`Phone ${phone} code is not cached`);
  }

  async checkPhoneCode(phone: string, code: string): Promise<boolean> {
    const cacheCode = await this.redisService.get(
      RedisGroupEnum.PHONE_VERIFY,
      phone,
    );
    const isPass = cacheCode === code;
    if (isPass) await this.redisService.del(RedisGroupEnum.PHONE_VERIFY, phone);
    return isPass;
  }

  async sendEmailCode(email: string) {
    const code = this.genVerifyCode();
    const isCached = await this.redisService.set(
      RedisGroupEnum.PHONE_VERIFY,
      email,
      code.toString(),
      this.verifyCodeExpiresSeconds,
    );
    if (isCached) {
      await this.mailLogService.sendTemplate(
        new SendMailTemplateReq({
          to: email,
          template: 'verify-email',
          subject: '罰單申訴會員 email 驗證通知信',
          context: { code },
          tag: 'ticket-appeal-system',
        }),
        MailLogCategory.VERIFY_EMAIL,
      );
      this.logger.debug(
        `Set verify code to redis and send email: ${email}: ${code}`,
      );
    } else throw new UserException(`Email ${email} code is not cached`);
  }

  async checkEmailCode(email: string, code: string): Promise<boolean> {
    const cacheCode = await this.redisService.get(
      RedisGroupEnum.EMAIL_VERIFY,
      email,
    );
    const isPass = cacheCode === code;
    if (isPass) await this.redisService.del(RedisGroupEnum.EMAIL_VERIFY, email);
    return isPass;
  }

  private genVerifyCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  async findOrCreate(
    dto: UserFindOrCreateDto,
    transaction?: Transaction,
  ): Promise<UserDto> {
    try {
      const userDto =
        (await this.findOneByLineUid(dto.lineUid)) ||
        (await this.findOneLikeEmail(dto.email)) ||
        (await this.create(dto, transaction));
      this.logger.debug({ userDto }, 'findOrCreate user: ');
      if (!userDto) throw new UserException('userDto is null');
      return userDto;
    } catch (e) {
      throw new UserException(`findOrCreate error: ${e.message}`);
    }
  }
}
