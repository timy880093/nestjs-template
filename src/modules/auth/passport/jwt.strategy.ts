import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import authConfig from '../auth.config';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectPinoLogger(JwtStrategy.name) private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authConfig().jwt.secret,
    });
  }

  async validate(payload: any): Promise<any> {
    // this.logger.debug({ payload }, 'JwtStrategy validate(): ');
    return {
      id: payload.sub,
      role: payload.role,
      // username: payload.username
    };
  }
}
