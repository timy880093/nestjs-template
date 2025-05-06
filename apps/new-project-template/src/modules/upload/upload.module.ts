import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UploadFilesModel } from './entity/upload-files.model';
import { UploadRepository } from './upload.repository';
import { S3StorageModule } from '@app/s3/s3-storage.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    S3StorageModule,
    SequelizeModule.forFeature([UploadFilesModel]),
    UsersModule,
  ],
  providers: [UploadService, UploadRepository],
  exports: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
