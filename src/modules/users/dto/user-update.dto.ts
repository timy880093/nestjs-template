import { UserDto } from './user.dto';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { UserPattern } from './user-pattern.const';
import { ApiProperty } from '@nestjs/swagger';
import { CommonUtil, ErrorUtil, PasswordUtil } from '../../../common/util';
import { RoleEnum } from './role.enum';
import { PhoneConstraints } from '../../../common/validator/phone.constraints';

export class UserUpdateDto {
  @IsOptional()
  @Matches(UserPattern.password.pattern, {
    message: UserPattern.password.message,
  })
  @ApiProperty({
    description: '8-32位(大小寫英數字,符號)，限制大小寫英文,數字至少各一',
    example: 'B1qaz2wsx',
  })
  password: string;

  @IsOptional()
  @IsEmail({}, { message: UserPattern.email.message })
  @ApiProperty({ description: '電子郵件', example: 'test@gmail.com' })
  email: string;

  @IsOptional()
  @Validate(PhoneConstraints, { message: UserPattern.phone.message })
  @ApiProperty({ description: '手機號碼', example: '0987654321' })
  phone: string;

  @IsOptional()
  @IsEnum(RoleEnum, { message: UserPattern.role.message })
  @ApiProperty({ description: '角色', example: 'user' })
  role: RoleEnum;

  @IsOptional()
  @IsBoolean({ message: ErrorUtil.invalidBoolean('isActive') })
  @ApiProperty({ description: '是否啟用', example: true })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  // @IsEnum(RefEnum, { message: UserPattern.ref.message })
  @ApiProperty({ description: '註冊來源', example: 'autopass' })
  ref?: string;

  async toUserDto(id: number): Promise<UserDto> {
    const user = new UserDto({
      password: this.password,
      email: this.email,
      phone: this.phone,
      role: this.role,
      isActive: this.isActive && this.isActive,
      ref: this.ref && this.ref,
    });
    if (!user.uuid) user.uuid = CommonUtil.genUuid();
    if (user.password && !PasswordUtil.isBcryptHash(user.password)) {
      user.password = await PasswordUtil.hashBySalt(user.password);
    }
    user.id = Number(id);
    return user;
  }

  // static async toUserDto(id: number, dto: UserUpdateDto): Promise<UserDto> {
  //   const userDto = new UserDto(dto);
  //   if (!userDto.uuid) userDto.uuid = CommonUtil.genUuid();
  //   if (userDto.password && !PasswordUtil.isBcryptHash(userDto.password)) {
  //     userDto.password = await PasswordUtil.hashBySalt(userDto.password);
  //   }
  //   userDto.id = Number(id);
  //   return userDto;
  // }
}
