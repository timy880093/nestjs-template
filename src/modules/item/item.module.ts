import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemRepository } from './item.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { ItemModel } from './item.model';

@Module({
  imports: [SequelizeModule.forFeature([ItemModel])],
  providers: [ItemService, ItemRepository],
  exports: [SequelizeModule, ItemService, ItemRepository],
})
export class ItemModule {}
