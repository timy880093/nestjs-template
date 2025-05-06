import { PostgresRepository } from '@app/postgres/postgres.repository';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UploadFilesModel } from './entity/upload-files.model';

@Injectable()
export class UploadRepository extends PostgresRepository<UploadFilesModel> {
  constructor(
    @InjectModel(UploadFilesModel)
    private readonly repository: typeof UploadFilesModel,
  ) {
    super(repository);
  }
}
