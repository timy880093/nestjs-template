import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/sequelize';
import { RedisService } from '@app/redis/redis.service';
import { UserModel } from './entity/user.model';
import { UserDto } from './dto/user.dto';
import { UsersRepository } from 'apps/new-project-template/src/modules/users/users.repository';
import { TestUtil } from '../../../../../libs/common/src/util';

const name = UsersService.name;
describe(name, () => {
  let service: UsersService;
  let usersRepository: UsersRepository;
  let redisService: RedisService;
  let logger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        TestUtil.mockLoggerProvider(name),
        {
          provide: getModelToken(UserModel),
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            restore: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            hset: jest.fn(),
            hgetall: jest.fn(),
            del: jest.fn(),
          },
        },
        // {
        //   provide: PinoLogger,
        //   useValue: {
        //     debug: jest.fn(),
        //     info: jest.fn(),
        //   },
        // },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    redisService = module.get<RedisService>(RedisService);
    logger = TestUtil.mockLoggerInstance(module, name);
    TestUtil.mockLoggerFunc(logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('should return cached user if found in cache', async () => {
      const cachedUser = new UserDto({ id: 1, username: 'testuser' });

      // mock getUserCache 返回 cache 中的用户
      jest.spyOn(service, 'getUserCache').mockResolvedValue(cachedUser);
      jest.spyOn(service, 'setUserCache');

      const result = await service.findOneById(1);

      expect(result).toEqual(cachedUser);
      expect(service.getUserCache).toHaveBeenCalledWith(1); // 檢查 getUserCache 代入的參數
      // 因為 cache 命中，所以不應該調用 setUserCache
      expect(service.setUserCache).not.toHaveBeenCalled();
    });

    it('should fetch user from database and cache it if not found in cache', async () => {
      const dbUser = new UserDto({ id: 1, username: 'testuser' });

      // 模拟 getUserCache 返回 null (缓存未命中)
      jest.spyOn(service, 'getUserCache').mockResolvedValue(null);
      // 模拟 userRepository2.findOneBy 返回数据库中的用户
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(dbUser);
      // 模拟 setUserCache 成功缓存用户
      jest.spyOn(service, 'setUserCache').mockResolvedValue('1');

      const result = await service.findOneById(1);

      expect(result).toEqual(dbUser);
      expect(service.getUserCache).toHaveBeenCalledWith(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(service.setUserCache).toHaveBeenCalledWith(dbUser);
    });
  });
});
