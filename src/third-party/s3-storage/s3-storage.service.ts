import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import uploadConfig from '../../config/upload.config';
import { UploadException } from '../../common/exception/upload.exception';
import { v4 as uuidv4 } from 'uuid';
import { UploadS3Dto } from './upload-s3.dto';

@Injectable()
export class S3StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly acceptedImageTypes: string[];
  private readonly acceptedVideoTypes: string[];
  private readonly acceptedMimeTypes: string[];
  private readonly imageLimitMB: number;
  private readonly videoLimitMB: number;

  constructor(
    @InjectPinoLogger(S3StorageService.name)
    private readonly logger: PinoLogger,
  ) {
    this.acceptedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/vnd.mozilla.apng',
    ];
    this.acceptedVideoTypes = [
      'video/quicktime',
      'video/x-msvideo',
      'video/mp4',
    ];
    this.acceptedMimeTypes = [
      ...this.acceptedImageTypes,
      ...this.acceptedVideoTypes,
    ];

    const { imageLimitMB, videoLimitMB } = uploadConfig().upload;
    this.imageLimitMB = imageLimitMB;
    this.videoLimitMB = videoLimitMB;

    const { accessKeyId, secretAccessKey, endpoint, region, bucket } =
      uploadConfig().s3;
    this.bucket = bucket;
    this.region = region;
    this.s3 = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      region,
    });
  }

  async upload(file: Express.Multer.File): Promise<UploadS3Dto> {
    try {
      this.checkFile(file);
      const dto = UploadS3Dto.build(file);
      dto.path = await this.uploadFileToS3(dto.name, file);
      return dto;
    } catch (error) {
      throw new UploadException(`Failed to upload file: ${error.message}`);
    }
  }

  private checkFile(file: Express.Multer.File) {
    if (!file.originalname) throw new UploadException('Filename is required');
    if (!this.acceptedMimeTypes.includes(file.mimetype))
      throw new UploadException('Invalid file type');
    if (file.mimetype in this.acceptedImageTypes) {
      if (file.size > 1024 * 1024 * this.imageLimitMB)
        throw new UploadException(`Image size exceeds ${this.imageLimitMB}MB`);
    } else if (file.mimetype in this.acceptedVideoTypes) {
      if (file.size > 1024 * 1024 * this.videoLimitMB)
        throw new UploadException(`Video size exceeds ${this.videoLimitMB}MB`);
    }
  }

  private async uploadFileToS3(
    filename: string,
    file: Express.Multer.File,
  ): Promise<string> {
    if (!filename) throw new UploadException('Filename is required');

    const params = {
      Bucket: this.bucket,
      Key: `${uuidv4().substring(0, 16)}_${filename}`,
      Body: file.buffer,
      ACL: ObjectCannedACL.public_read, // 存取權限
      ContentType: file.mimetype,
    };
    const _ = await this.s3.send(new PutObjectCommand(params));
    this.logger.debug({ name: params.Key }, `File uploaded successfully`);
    return `https://${params.Bucket}.${this.region}.linodeobjects.com/${params.Key}`;
  }

  async deletePath(path: string) {
    if (!path) return;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    await this.deleteFileFromS3(filename);
    this.logger.debug({ filename }, `File deleted done`);
  }

  async deleteFileFromS3(fileKey: string): Promise<void> {
    const params = {
      Bucket: this.bucket, // Ensure you have the bucket name in your config
      Key: fileKey,
    };

    try {
      await this.s3.send(new DeleteObjectCommand(params));
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
