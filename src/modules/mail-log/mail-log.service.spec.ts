import { Test, TestingModule } from '@nestjs/testing';
import { MailLogService } from './mail-log.service';

describe('MailLogService', () => {
  let service: MailLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailLogService],
    }).compile();

    service = module.get<MailLogService>(MailLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
