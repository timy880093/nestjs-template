import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service';
import { RoleEnum } from '../../modules/users/dto/role.enum';

@Injectable()
export class SelfUserGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    // const isAdmin = this.reflector.get<boolean>(
    //   IS_ADMIN_KEY,
    //   context.getHandler(),
    // );
    const request = context.switchToHttp().getRequest();
    if (!request.user) throw new ForbiddenException('Unauthorized: no user');
    // return false;

    const userId =
      request.params.id || request.params.userId || request.body.userId;

    if (request.user.role !== RoleEnum.ADMIN && request.user.id !== userId)
      throw new ForbiddenException('Unauthorized: not self data');
    // return false;

    const user = await this.userService.findOneById(userId);
    if (!user) throw new ForbiddenException('Unauthorized: user not found');
    request.userResult = user;

    return true;
  }
}
