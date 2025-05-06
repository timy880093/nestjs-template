import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { UploadFilesDto } from '../dto/upload-files.dto';

@Table({
  tableName: 'upload_files',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class UploadFilesModel extends Model<UploadFilesModel> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column userId: number;
  @Column type: string;
  @Column name: string;
  @Column path: string;

  static toDto(model: UploadFilesModel): UploadFilesDto {
    if (!model) return null;
    const uploadFiles: UploadFilesDto = plainToInstance(
      UploadFilesDto,
      model.toJSON(),
    );
    uploadFiles.id = Number(model.id);
    return uploadFiles;
  }
}
