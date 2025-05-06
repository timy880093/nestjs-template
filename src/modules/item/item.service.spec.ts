import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ItemModule } from './item.module';

describe('ItemService', () => {
  let service: ItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ItemModule],
      providers: [ItemService],
    }).compile();

    service = module.get<ItemService>(ItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
