import { UserDto } from './user.dto';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Validate,
} from 'class-validator';
import { UserPattern } from './user-pattern.const';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordUtil } from '../../../common/util/password.util';
import { RoleEnum } from './role.enum';
import { CommonUtil } from '../../../common/util/common.util';
import { PhoneConstraints } from '../../../common/validator/phone.constraints';

export class UserCreateDto {
  @Matches(UserPattern.username.pattern, {
    message: UserPattern.username.message,
  })
  @ApiProperty({ description: '6-16位(大小寫英數字)', example: 'testtest' })
  username: string;

  @Matches(UserPattern.password.pattern, {
    message: UserPattern.password.message,
  })
  @ApiProperty({
    description: '8-32位(大小寫英數字,符號)，限制大小寫英文,數字至少各一',
    example: 'B1qaz2wsx',
  })
  password: string;

  @IsEmail({}, { message: UserPattern.email.message })
  @ApiProperty({ description: '電子郵件', example: 'test@gmail.com' })
  email: string;

  @Validate(PhoneConstraints, { message: UserPattern.phone.message })
  @ApiProperty({ description: '手機號碼', example: '0987654321' })
  phone: string;

  @IsOptional()
  @IsEnum(RoleEnum, { message: UserPattern.role.message })
  @ApiProperty({ description: '角色', example: 'user' })
  role: RoleEnum;

  @IsOptional()
  @IsString()
  // @Transform(
  //   ({ value }) => value && CommonUtil.stringToEnum(RefEnum, value.toString()),
  // )
  // @IsEnum(RefEnum, { message: UserPattern.ref.message })
  @ApiProperty({ description: '註冊來源', example: 'carmochi' })
  ref: string;

  static async toUserDto(dto: UserCreateDto): Promise<UserDto> {
    const userDto = new UserDto(dto);
    if (!userDto.uuid) userDto.uuid = CommonUtil.genUuid();
    if (userDto.password && !PasswordUtil.isBcryptHash(userDto.password))
      userDto.password = await PasswordUtil.hashBySalt(userDto.password);
    userDto.role = userDto.role || RoleEnum.USER;
    return userDto;
  }
}
