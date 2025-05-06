import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../../../apps/new-project-template/src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtil } from '@app/common/util';
import { UserDto } from '../../../apps/new-project-template/src/modules/users/dto/user.dto';
import { TokenRes } from './dto/token.res';
import authConfig from './auth.config';
import { SendMailTemplateReq } from '@app/mail/dto/send-mail-template.req';
import { NotfoundException } from '@app/common/exception/notfound.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserInfo } from '@app/common/decorator/token-user.decorator';
import { MailLogCategory } from '../../../apps/new-project-template/src/modules/mail-log/dto/mail-log.enum';
import { MailLogService } from '../../../apps/new-project-template/src/modules/mail-log/mail-log.service';
import { MailLogDto } from '../../../apps/new-project-template/src/modules/mail-log/dto/mail-log.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private usersService: UsersService,
    private mailLogService: MailLogService,
    private jwtService: JwtService,
  ) {
    this.logger.debug({ authConfig: authConfig() }, 'Init auth config: ');
  }

  async signIn({ id, role }: UserInfo): Promise<TokenRes> {
    const token = this.jwtService.sign({
      sub: id,
      role,
    });
    // this.logger.debug({ token }, 'signIn token obj: ');
    await this.usersService.updateLastLoginAt(id);
    return TokenRes.create(token, authConfig().jwt.expiresIn);
  }

  async validate(identity: string, pass: string): Promise<UserDto> {
    try {
      const user = identity.includes('@')
        ? await this.usersService.findOneLikeEmail(identity)
        : await this.usersService.findOneLikeUsername(identity);
      const isValid = await PasswordUtil.compare(pass, user?.password);
      return isValid ? user : null;
    } catch (e) {
      throw new UnauthorizedException(`Unauthorized: ${e.message}`);
    }
  }

  async resetPasswordEmail(email: string): Promise<MailLogDto> {
    try {
      const userDto = await this.usersService.findOneLikeEmail(email);
      if (!userDto) {
        throw new NotfoundException('User not found');
      }
      // get token
      const token = this.jwtService.sign({
        sub: userDto.id,
      });
      const sendTemplateRequestDto = new SendMailTemplateReq({
        to: [userDto.email],
        subject: '罰單申訴系統 - 重設密碼',
        template: 'reset-password',
        context: {
          username: userDto.username,
          resetLink: `${authConfig().user.resetPasswordURL}?token=${token}`,
        },
      });

      const sendResponseDto = await this.mailLogService.sendTemplate(
        sendTemplateRequestDto,
        MailLogCategory.RESET_PASSWORD,
      );
      // if (CommonUtil.isArray(sendResponseDto.errors))
      //   throw new ServerException('Send email failed');
      return sendResponseDto;
    } catch (e) {
      this.logger.error('resetPasswordEmail error: ', e.message);
      return null;
    }
  }
}
