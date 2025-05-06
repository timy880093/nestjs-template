import { Test, TestingModule } from '@nestjs/testing';
import { MailLogController } from './mail-log.controller';

describe('MailLogController', () => {
  let controller: MailLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailLogController],
    }).compile();

    controller = module.get<MailLogController>(MailLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
