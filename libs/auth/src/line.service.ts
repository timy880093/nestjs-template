import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../apps/new-project-template/src/modules/users/users.service';
import { AuthService } from './auth.service';
import axios from 'axios';
import authConfig from './auth.config';
import * as qs from 'querystring';
import { Oauth2SignInDto } from './dto/oauth2-sign-in.dto';
import { LineProfileRes } from './dto/line-profile.res';
import { LineVerifyRes } from './dto/line-verify.res';
import { TokenRes } from './dto/token.res';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class LineService {
  constructor(
    @InjectPinoLogger(LineService.name) private readonly logger: PinoLogger,
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  async lineAuth({
    email,
    userId: lineUid,
  }: LineProfileRes): Promise<TokenRes> {
    try {
      this.logger.debug({ email, lineUid }, `lineAuth: `);
      const userDto = await this.usersService.findOrCreate({ email, lineUid });
      if (!userDto.lineUid) {
        // 若最早用 email 登入，後來改用 line 登入，則更新 lineUid
        await this.usersService.updateWithCache(userDto.id, { lineUid });
        this.logger.debug({ email, lineUid }, `整合 line 登入和 email 登入`);
      }
      return this.authService.signIn(userDto);
    } catch (e) {
      throw new UnauthorizedException(`lineAuth error: ${e.message}`);
    }
  }

  async signInOrSignUpByIdToken(idToken: string): Promise<TokenRes> {
    const { sub: userId, email } = await this.verifyAndGetProfile(idToken);
    return this.lineAuth({ email, userId });
  }

  async signInOrSignUpByAccessToken({
    token,
    email,
  }: Oauth2SignInDto): Promise<TokenRes> {
    const profile = await this.getUserProfile(token);
    profile.email = email || profile.email;
    return this.lineAuth(profile);
  }

  // 透過 accessToken 取得使用者一般資訊(不含email)
  async getUserProfile(accessToken: string): Promise<LineProfileRes> {
    try {
      const response = await axios.get('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        userId: response.data.userId,
        displayName: response.data.displayName,
        pictureUrl: response.data.pictureUrl,
        statusMessage: response.data.statusMessage,
      };
      // return response.data;
    } catch (err) {
      throw new UnauthorizedException(
        'Failed to fetch user profile: ',
        err.message,
      );
    }
  }

  // 透過 idToken 驗證是否為 line 授權，並取得使用者資訊(如果 scope 有 email 就會包含 email)
  async verifyAndGetProfile(idToken: string): Promise<LineVerifyRes> {
    try {
      const params = {
        id_token: idToken,
        client_id: authConfig().line.channelID,
      };

      const response = await axios.post(
        authConfig().line.verifyURL,
        qs.stringify(params),
      );
      return response.data as LineVerifyRes;
    } catch (e) {
      throw new UnauthorizedException(
        `Failed to verify token from Line: ${e.message}`,
      );
    }
  }
}
