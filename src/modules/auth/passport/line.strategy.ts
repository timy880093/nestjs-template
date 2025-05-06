import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy as OAuth2Strategy,
  StrategyOptions,
  VerifyFunction,
} from 'passport-oauth2';
import axios from 'axios';
import authConfig from '../auth.config';
import * as qs from 'querystring';
import { LineService } from '../line.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// 執行順序：getOAuthAccessToken -> validate -> verify
class CustomOAuth2Strategy extends OAuth2Strategy {
  constructor(options: StrategyOptions, verify: VerifyFunction) {
    super(options, verify);
    this.name = 'line';
  }

  async getOAuthAccessToken(code: string, params: any, callback: Function) {
    params = params || {};
    const post_data = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: authConfig().line.callbackURL,
      client_id: authConfig().line.channelID,
      client_secret: authConfig().line.channelSecret,
      ...params,
    };

    try {
      // 使用授權碼 code Post /token 交換取得 token，但只能取得一次
      const response = await axios.post(
        authConfig().line.tokenURL,
        qs.stringify(post_data),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      // 將這些參數傳入 validate 方法
      const { access_token, refresh_token, id_token, expires_in } =
        response.data;
      callback(null, access_token, refresh_token, { id_token, expires_in });
    } catch (error) {
      callback(error);
    }
  }
}

@Injectable()
export class LineStrategy extends PassportStrategy(
  CustomOAuth2Strategy,
  'line',
) {
  constructor(
    @InjectPinoLogger(LineStrategy.name) private readonly logger: PinoLogger,
    private readonly lineService: LineService,
  ) {
    super(
      {
        authorizationURL: authConfig().line.authorizationURL,
        tokenURL: authConfig().line.tokenURL,
        clientID: authConfig().line.channelID,
        clientSecret: authConfig().line.channelSecret,
        callbackURL: authConfig().line.callbackURL,
        scope: ['profile', 'openid', 'email'],
        state: true, // 防止 CSRF 攻擊：策略會產生隨機的 state 參數，包在 authorization 請求送出，並且在 callback 時會自動檢查 state 參數
      } as StrategyOptions,
      async (
        accessToken: string,
        refreshToken: string,
        params: any,
        profile: any,
        done: Function,
      ) => {
        const idToken = params.id_token || '';

        const userProfile = await this.lineService.verifyAndGetProfile(idToken);
        // const userProfile = await this.getUserProfile(accessToken);
        const user = {
          accessToken,
          refreshToken,
          idToken,
          profile: userProfile,
        };
        done(null, user);
      },
    );
  }
}
