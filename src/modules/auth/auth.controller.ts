import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../common/guard/local-auth.guard';
import { Public } from '../../common/decorator/public.decorator';
import { LineAuthGuard } from '../../common/guard/line-auth.guard';
import { LineService } from './line.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { TokenRes } from './dto/token.res';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserDto } from '../users/dto/user.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Oauth2SignInDto } from './dto/oauth2-sign-in.dto';
import { UserUpdateDto } from '../users/dto/user-update.dto';
import {
  TokenUser,
  UserInfo,
} from '../../common/decorator/token-user.decorator';
import { MailLogDto } from '../mail-log/dto/mail-log.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private lineService: LineService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login', type: TokenRes })
  @ApiBody({ type: SignInDto })
  async signIn(@TokenUser() userInfo: UserInfo): Promise<TokenRes> {
    // console.log('req', user);
    return this.authService.signIn(userInfo);
  }

  @Public()
  @UseGuards(LineAuthGuard)
  @Get('line')
  @ApiOperation({ summary: '(Unused)Line OAuth2 Page' })
  async line(): Promise<void> {
    // 將被重定向到 Line 的登錄頁面
  }

  @Public()
  @UseGuards(LineAuthGuard)
  @Get('line/callback')
  @ApiOperation({ summary: '(Unused)Line OAuth2 callback' })
  @ApiResponse({
    status: 200,
    description: 'Line OAuth2 callback',
    type: TokenRes,
  })
  @ApiParam({ name: 'code', required: true, description: 'Line OAuth2 code' })
  @ApiBody({ type: UserDto })
  async lineAuthRedirect(
    @Request() req: any,
    // @Query('code') code: string,
  ): Promise<TokenRes> {
    // console.log('req', req.user);
    // 使用 Passport 並成功驗證，strategy 的資料會存到 req.user
    const { email, sub: userId } = req.user.profile;
    return this.lineService.lineAuth({
      email,
      userId,
    });
  }

  // //測試用
  // @Public()
  // @Get('line/callback2/:uid/:email')
  // async testtLineAuthRedirect(
  //   @Param('uid') uid: string,
  //   @Param('email') email: string,
  // ): Promise<TokenRes> {
  //   // 使用 Passport 並成功驗證，strategy 的資料會存到 req.user
  //   return this.lineService.signInOrSignUp({ userId: uid, email });
  // }

  @Public()
  @Post('oauth2/line/token')
  @ApiOperation({ summary: 'Line OAuth2 callback' })
  @ApiResponse({
    status: 200,
    description: 'Line OAuth2 callback',
    type: TokenRes,
  })
  @ApiBody({ type: Oauth2SignInDto })
  async postLineIdToken(@Body() dto: Oauth2SignInDto): Promise<TokenRes> {
    return this.lineService.signInOrSignUpByIdToken(dto.token);
  }

  @Public()
  @Post('oauth2/line/access-token')
  @ApiOperation({ summary: 'Line OAuth2 callback' })
  @ApiResponse({
    status: 200,
    description: 'Line OAuth2 callback',
    type: TokenRes,
  })
  @ApiBody({ type: Oauth2SignInDto })
  async postLineAccessToken(@Body() dto: Oauth2SignInDto) {
    return this.lineService.signInOrSignUpByAccessToken(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully reset password.',
  })
  @ApiBody({ type: UserUpdateDto })
  async resetPassword(@Body() { email }: any): Promise<MailLogDto> {
    return this.authService.resetPasswordEmail(email);
  }
}
