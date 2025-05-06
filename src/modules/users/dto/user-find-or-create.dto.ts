import { SourceEnum } from 'src/common/dto/source.enum';

export interface UserFindOrCreateDto {
  email?: string;
  lineUid?: string;
  phone?: string;
  ref?: string;
  source?: SourceEnum;
}
