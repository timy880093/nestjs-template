import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction, WhereOptions } from 'sequelize';
import { RecognizeLogModel } from '../entity/recognize-log.model';
import { RecognizeLogDto } from '../dto/recognize-log.dto';

@Injectable()
export class RecognizeLogRepository {
  constructor(
    @InjectModel(RecognizeLogModel)
    private readonly repository: typeof RecognizeLogModel,
  ) {}

  async create(
    dto: Partial<RecognizeLogDto>,
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    const result = await this.repository.create(dto, { transaction });
    return RecognizeLogModel.toDto(result);
  }

  async update(
    id: number,
    dto: Partial<RecognizeLogDto>,
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    const [_, results] = await this.repository.update(
      { ...dto },
      {
        where: { id },
        returning: true,
        transaction,
      },
    );
    return RecognizeLogModel.toDto(results[0]);
  }

  async findOne(
    where: WhereOptions<RecognizeLogModel>,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    const result = await this.repository.findOne({
      where: { ...where },
      order: sort,
      transaction,
    });
    return result && RecognizeLogModel.toDto(result);
  }
}
