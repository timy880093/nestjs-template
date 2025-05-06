import { CommonUtil } from '@app/common/util/common.util';

export class UploadS3Dto {
  type: string;
  name: string;
  path?: string;

  constructor(dto: Partial<UploadS3Dto>) {
    Object.assign(this, dto);
  }

  static build(file: Express.Multer.File): UploadS3Dto {
    return new UploadS3Dto({
      name: CommonUtil.parseGarbled(file.originalname),
      type: file.mimetype,
    });
  }
}
