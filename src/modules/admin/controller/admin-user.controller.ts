import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guard/admin.guard';
import {
  ApiBody,
  ApiHeaders,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';
import { UsersService } from '../../users/users.service';
import { UserUpdateDto } from '../../users/dto/user-update.dto';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiHeaders([{ name: 'Authorization', description: 'Bearer {access_token}' }])
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
    type: [UserDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<UserDto[]> {
    const userDtos = await this.usersService.findAll();
    return userDtos.map((userDto) => userDto.toResponse());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a single user.',
    type: UserDto,
  })
  @ApiParam({ name: 'id', required: true, description: 'The user ID' })
  async findOne(
    @Param('id') id: number,
    // @User() user: UserDto,
  ): Promise<UserDto> {
    const userDto = await this.usersService.findOneById(id);
    return userDto.toResponse();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully updated.',
    type: UserDto,
  })
  @ApiBody({ type: UserUpdateDto })
  @ApiParam({ name: 'id', required: true, description: 'The user ID' })
  async update(
    @Param('id') id: number,
    // @User() user: UserDto,
    @Body() userUpdateDto: UserUpdateDto,
  ): Promise<UserDto> {
    const userDto = await this.usersService.updateProfile(id, userUpdateDto);
    return userDto.toResponse();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully deleted.',
  })
  @ApiParam({ name: 'id', required: true, description: 'The user ID' })
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
