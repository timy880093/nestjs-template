export class UploadFilesDto {
  id: number;
  userId: number;
  type: string;
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(dto: Partial<UploadFilesDto>) {
    Object.assign(this, dto);
  }
}
