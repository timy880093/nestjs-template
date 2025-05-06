import { Injectable } from '@nestjs/common';
import { RecognizeLogRepository } from '../repository/recognize-log.repository';
import { RecognizeLogDto } from '../dto/recognize-log.dto';
import { Transaction } from 'sequelize';

@Injectable()
export class RecognizeLogService {
  constructor(
    // private readonly recognitionService: RecognitionService,
    private readonly recognizeLogRepository: RecognizeLogRepository,
  ) {}

  async findOne(
    where: Partial<RecognizeLogDto>,
    sort?: [string, string][],
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    return this.recognizeLogRepository.findOne(where, sort, transaction);
  }

  async findOneLatest(
    where: Partial<RecognizeLogDto>,
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    return this.findOne(where, [['updated_at', 'DESC']], transaction);
  }

  async create(
    dto: Partial<RecognizeLogDto>,
    transaction?: Transaction,
  ): Promise<RecognizeLogDto> {
    if (dto.id) delete dto.id;
    return this.recognizeLogRepository.create(dto, transaction);
  }
}
