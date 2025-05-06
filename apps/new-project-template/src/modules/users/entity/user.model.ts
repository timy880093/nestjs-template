import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../dto/user.dto';
import { RoleEnum } from '../dto/role.enum';
import { SourceEnum } from '@app/common/dto/source.enum';

@Table({
  tableName: 'user',
  timestamps: true, // 自動加 createdAt, updatedAt
  paranoid: true, // 啟用軟刪除 deletedAt, remove 操作會變成 update 此欄位, 且查詢會自動去除有 deletedAt 的結果
})
export class UserModel extends Model {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column({
    unique: true,
  })
  username: string;
  @Column password: string;
  // @Column name: string;
  @Column email: string;
  @Column phone: string;
  @Column(DataType.TEXT) role: RoleEnum;
  @Column createdAt: Date;
  @Column updatedAt: Date;
  @Column deletedAt: Date;
  @Column lastLoginAt: Date;
  @Column isActive: boolean;
  @Column isEmailVerified: boolean;
  @Column isPhoneVerified: boolean;
  @Column lineUid: string;
  @Column(DataType.TEXT)
  source: SourceEnum;
  @Column(DataType.TEXT)
  ref: string;
  @Column uuid: string;

  static toUserDto(model: UserModel): UserDto {
    return plainToInstance(UserDto, model.toJSON());
  }

  static toUserDtos(models: UserModel[]): UserDto[] {
    return models.map((model) => this.toUserDto(model));
  }
}
