import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventLogModel } from '../entity';
import { GenericRepository } from '../../../common/repository/generic.repository';

@Injectable()
export class EventLogRepository extends GenericRepository<EventLogModel> {
  constructor(
    @InjectModel(EventLogModel)
    private readonly model: typeof EventLogModel,
  ) {
    super(EventLogModel);
  }
}
