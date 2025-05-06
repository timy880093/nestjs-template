import { S3StorageService } from '@app/s3/s3-storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import uploadConfig from '../../config/upload.config';
import { UploadFilesDto } from './dto/upload-files.dto';
import { UploadRepository } from './upload.repository';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly acceptedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/vnd.mozilla.apng',
  ];
  private readonly acceptedVideoTypes = [
    'video/quicktime',
    'video/x-msvideo',
    'video/mp4',
  ];
  private readonly acceptedMimeTypes = [
    ...this.acceptedImageTypes,
    ...this.acceptedVideoTypes,
  ];

  constructor(
    @InjectPinoLogger(UploadService.name) private readonly logger: PinoLogger,
    private readonly s3StorageService: S3StorageService,
    private readonly uploadRepository: UploadRepository,
  ) {
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: uploadConfig().s3.accessKeyId,
        secretAccessKey: uploadConfig().s3.secretAccessKey,
      },
      endpoint: uploadConfig().s3.endpoint,
      region: uploadConfig().s3.region,
    });
  }

  async upload(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UploadFilesDto> {
    const uploadS3Dto = await this.s3StorageService.upload(file);
    const uploadFilesDto = new UploadFilesDto({ userId, ...uploadS3Dto });
    try {
      const result = await this.uploadRepository.create(uploadFilesDto);
      return new UploadFilesDto(result);
    } catch (e) {
      // rollback from s3
      await this.s3StorageService.deletePath(uploadFilesDto.path);
      throw e;
    }
  }

  async findOneById(id: number): Promise<UploadFilesDto> {
    const result = await this.uploadRepository.findOne({ id });
    return new UploadFilesDto(result);
  }

  async findAllByIds(ids: number[]): Promise<UploadFilesDto[]> {
    const result = await this.uploadRepository.findAll({ id: ids });
    return result.map((item) => new UploadFilesDto(item));
  }
}
