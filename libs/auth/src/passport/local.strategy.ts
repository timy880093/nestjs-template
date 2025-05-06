import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// 所有有加 LocalGuard() 的路由，進入路由前會執行 validate()，並將結果放回 req
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectPinoLogger(LocalStrategy.name) private readonly logger: PinoLogger,
    private authService: AuthService,
  ) {
    // field 對應 request 傳進來的屬性名稱
    super({
      passReqToCallback: true,
      usernameField: 'identity',
      passwordField: 'password',
    });
  }

  async validate(
    req: Request,
    username: string,
    password: string,
  ): Promise<any> {
    // this.logger.debug({ body: req.body }, 'LocalStrategy validate(): ');
    const user = await this.authService.validate(username, password);
    if (!user) throw new UnauthorizedException();
    // 驗證成功，會將 user 資訊加在路由方法的 req.user 上
    return user;
  }
}
