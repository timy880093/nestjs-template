import { RoleEnum } from './role.enum';
import { SourceEnum } from '../../../common/dto/source.enum';

export class UserDto {
  id: number;
  username: string;
  password: string;
  email: string;
  phone: string;
  role: RoleEnum;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lineUid: string;
  source: SourceEnum;
  ref: string;
  uuid: string;

  constructor(dto?: Partial<UserDto>) {
    Object.assign(this, dto);
  }

  toResponse(): UserDto {
    delete this.password;
    return this;
  }
}
