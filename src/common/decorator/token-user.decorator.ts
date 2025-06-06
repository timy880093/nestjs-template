import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleEnum } from '../../modules/users/dto/role.enum';

export interface UserInfo {
  id: number;
  role: RoleEnum;
}

export const TokenUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
