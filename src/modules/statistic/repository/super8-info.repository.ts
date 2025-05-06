import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GenericRepository } from '../../../common/repository/generic.repository';
import { Super8InfoModel } from '../entity';

@Injectable()
export class Super8InfoRepository extends GenericRepository<Super8InfoModel> {
  constructor(
    @InjectModel(Super8InfoModel)
    private readonly model: typeof Super8InfoModel,
  ) {
    super(Super8InfoModel);
  }
}
