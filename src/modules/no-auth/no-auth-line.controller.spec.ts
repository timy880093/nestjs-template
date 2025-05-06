import { Test, TestingModule } from '@nestjs/testing';
import { NoAuthLineController } from './no-auth-line.controller';

describe('PublicController', () => {
  let controller: NoAuthLineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoAuthLineController],
    }).compile();

    controller = module.get<NoAuthLineController>(NoAuthLineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
