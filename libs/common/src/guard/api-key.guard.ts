import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import appConfig from '../../../../apps/new-project-template/src/config/app.config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly fixedKey: string;

  constructor() {
    this.fixedKey = appConfig().ticketApiKey;
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { 'x-api-key': apiKey } = request.headers;
    const allowKeys = this.fixedKey.split(',');
    if (allowKeys.includes(apiKey)) return true;

    throw new ForbiddenException('Unauthorized: invalid api key');
  }
}
