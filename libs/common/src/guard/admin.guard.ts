import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../../../../apps/new-project-template/src/modules/users/dto/role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!request.user)
      // return false;
      throw new ForbiddenException('Unauthorized: no user');

    if (request.user.role !== RoleEnum.ADMIN)
      throw new ForbiddenException('Unauthorized: admin only');
    return true;
    //
    // const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    // return isAdmin;
  }
}
