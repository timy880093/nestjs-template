import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UploadFilesModel } from './entity/upload-files.model';
import { Op } from 'sequelize';
import { UploadFilesDto } from './dto/upload-files.dto';
import { UploadException } from '../../common/exception/upload.exception';

@Injectable()
export class UploadRepository {
  constructor(
    @InjectModel(UploadFilesModel)
    private readonly repository: typeof UploadFilesModel,
  ) {}

  async findAllByIds(ids: number[]): Promise<UploadFilesDto[]> {
    // find all by id array, use postgres $in operator
    const models = await this.repository.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });
    return models.map((model) => UploadFilesModel.toDto(model));
  }

  async create(dto: UploadFilesDto): Promise<UploadFilesDto> {
    try {
      const uploadFilesModel = await this.repository.create(dto);
      return UploadFilesModel.toDto(uploadFilesModel);
    } catch (e) {
      throw new UploadException(`Create file failed: ${e.message}`);
    }
  }

  async update(id: number, dto: UploadFilesDto): Promise<UploadFilesDto> {
    try {
      const [, results] = await this.repository.update(
        { ...dto },
        {
          where: { id },
          returning: true,
        },
      );
      return UploadFilesModel.toDto(results[0]);
    } catch (e) {
      throw new UploadException(`Create file failed: ${e.message}`);
    }
  }
}
