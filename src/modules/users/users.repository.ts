import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserDto } from './dto/user.dto';
import { UserModel } from './entity/user.model';
import { Op, Transaction, WhereOptions } from 'sequelize';
import { UserException } from '../../common/exception/user.exception';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(UserModel)
    private readonly model: typeof UserModel,
  ) {}

  async findOne(dto: WhereOptions<UserDto>): Promise<UserDto | undefined> {
    try {
      const result = await this.model.findOne({
        where: { ...dto },
        // rejectOnEmpty: undefined,
      });
      return result ? UserModel.toUserDto(result) : undefined;
    } catch (e) {
      e.message = `User with ${JSON.stringify(dto)} not found`;
      throw e;
    }
  }

  //[Op.or]: orCondition,
  async findAll(dto?: WhereOptions<UserDto>, or?: any): Promise<UserDto[]> {
    let options = {};
    if (dto) options = { ...dto };
    if (or) options[Op.or] = or;

    const results = await this.model.findAll({
      where: options,
    });
    return UserModel.toUserDtos(results);
  }

  async create(
    dto: Partial<UserDto>,
    transaction?: Transaction,
  ): Promise<UserDto> {
    try {
      const result = await this.model.create(dto, {
        transaction,
      });
      return UserModel.toUserDto(result);
    } catch (e) {
      throw new UserException(`Failed to create user: ${e.message}`);
    }
  }

  async update(
    where: WhereOptions<UserDto>,
    dto: Partial<UserDto>,
  ): Promise<UserDto> {
    try {
      const [, results] = await this.model.update(dto, {
        where,
        returning: true,
      });
      return UserModel.toUserDto(results[0]);
    } catch (e) {
      throw new UserException(
        `Failed to updateProfile user where ${where}: ${e.message}`,
      );
    }
  }

  async remove(where: WhereOptions<UserDto>): Promise<number> {
    try {
      return this.model.destroy({ where });
    } catch (e) {
      throw new UserException(`Failed to remove user ${where}: ${e.message}`);
    }
  }

  async restore(id: number): Promise<UserDto> {
    try {
      await this.model.restore({
        where: { id },
      });
      return this.findOne({ id });
    } catch (e) {
      throw new UserException(`Failed to restore user id ${id}: ${e.message}`);
    }
  }
}
