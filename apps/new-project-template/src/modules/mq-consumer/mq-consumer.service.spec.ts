import { Test, TestingModule } from '@nestjs/testing';
import { MqConsumerService } from './mq-consumer.service';

describe('MqConsumerService', () => {
  let service: MqConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MqConsumerService],
    }).compile();

    service = module.get<MqConsumerService>(MqConsumerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
