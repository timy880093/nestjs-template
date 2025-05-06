import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCreateDto } from './dto/user-create.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserDto } from './dto/user.dto';
import { Public } from '../../common/decorator/public.decorator';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserId } from '../../common/decorator/user-id.decorator';
import {
  CheckEmailCodeReq,
  CheckPhoneCodeReq,
  SendEmailCodeReq,
  SendPhoneCodeReq,
} from './dto/verify-code.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create user ' })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: UserDto,
  })
  @ApiBody({ type: UserCreateDto })
  async create(@Body() userCreateDto: UserCreateDto): Promise<UserDto> {
    return this.usersService.createByGeneric(userCreateDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Return a single user.',
    type: UserDto,
  })
  async findMe(@UserId() userId: number): Promise<UserDto> {
    const userDto = await this.usersService.findOneById(userId);
    return userDto.toResponse();
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: UserDto,
  })
  @ApiBody({ type: UserUpdateDto })
  async updateMe(
    @UserId() userId: number,
    @Body() userUpdateDto: UserUpdateDto,
  ): Promise<UserDto> {
    const userDto = await this.usersService.updateProfile(
      userId,
      userUpdateDto,
    );
    return userDto.toResponse();
  }

  @Public()
  @Post('verify-phone/send')
  async sendCodeForPhone(@Body() { phone }: SendPhoneCodeReq) {
    await this.usersService.sendPhoneCode(phone);
  }

  @Public()
  @Post('verify-phone/check')
  async checkCodeForPhone(
    @Body() { phone, code }: CheckPhoneCodeReq,
  ): Promise<boolean> {
    return this.usersService.checkPhoneCode(phone, code);
  }

  @Public()
  @Post('verify-email/send')
  async sendCodeForEmail(@Body() { email }: SendEmailCodeReq) {
    await this.usersService.sendEmailCode(email);
  }

  @Public()
  @Post('verify-email/check')
  async checkCodeForEmail(
    @Body() { email, code }: CheckEmailCodeReq,
  ): Promise<boolean> {
    return this.usersService.checkEmailCode(email, code);
  }
}
