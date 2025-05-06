import { Test, TestingModule } from '@nestjs/testing';
import { PostgresRepository } from '@app/postgres/postgres.repository';

describe('PostgresRepository', () => {
  let service: PostgresRepository<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostgresRepository],
    }).compile();

    service = module.get<PostgresRepository>(PostgresRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
