import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { SendSmsReq } from './send-sms.req';
import { SendSmsError, SendSmsRes } from './send-sms.res';
import { ConfigType } from '@nestjs/config';
import smsConfig from '../../config/sms.config';
import { CommonException } from '../../common/exception/common.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// 33 字 = 1 元
@Injectable()
export class SmsService implements OnModuleInit {
  private token = '';
  private readonly twCountryCode: string;
  private readonly e8dUid: string;
  private readonly e8dPwd: string;

  constructor(
    @InjectPinoLogger(SmsService.name) private readonly logger: PinoLogger,
    @Inject(smsConfig.KEY) config: ConfigType<typeof smsConfig>,
  ) {
    this.twCountryCode = '+886';
    this.e8dUid = config.e8dUid;
    this.e8dPwd = config.e8dPwd;
  }

  async onModuleInit() {
    // await this.connect();
    this.token = await this.getToken();
  }

  // private async connect() {
  //   return axios
  //     .post('https://api.e8d.tw/API21/HTTP/ConnectionHandler.ashx', {
  //       HandlerType: 3,
  //       VerifyType: 1,
  //       UID: this.e8dUid,
  //       PWD: this.e8dPwd,
  //     })
  //     .then((response) => (this.token = response.data.Msg))
  //     .catch((error) => this.logger.error(error));
  // }

  private async getToken(): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.e8d.tw/API21/HTTP/ConnectionHandler.ashx',
        {
          HandlerType: 3,
          VerifyType: 1,
          UID: this.e8dUid,
          PWD: this.e8dPwd,
        },
      );
      return response.data.Msg;
    } catch (e) {
      throw new CommonException('簡訊服務連線失敗');
    }
  }

  async sendText({ phones, subject, text }: SendSmsReq): Promise<SendSmsRes> {
    const sendSmsErrors = [];
    for (const phone of phones) {
      const error = await this.send({
        to: this.mobileNumberFormatter(this.twCountryCode, phone),
        subject,
        text,
      });
      if (error) sendSmsErrors.push(error);
    }
    return { totalCount: phones.length, sendSmsErrors };
  }

  /**
   * Private
   * @param {*} options // include to、text
   */
  async send({ to, subject, text }: any): Promise<SendSmsError> {
    try {
      const response = await axios.post(
        'https://api.e8d.tw/API21/HTTP/SendSMS.ashx',
        {
          UID: this.e8dUid,
          PWD: this.e8dPwd,
          DEST: to,
          SB: subject || '',
          MSG: text,
          ST: '',
        },
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            auth: this.token,
          },
        },
      );
      // FIXME 不確定，似乎每次送完一封都會刷新 token?
      this.logger.debug({ data: response.data }, 'send sms response: ');
      this.token = response.data.Msg;
      return;
    } catch (e) {
      this.logger.warn({ error: e }, 'send sms error: ');
      return { phone: to, message: e.message };
    }
  }

  mobileNumberFormatter(countryCode: string, phone: string): string {
    if (phone[0] === '0') phone = phone.slice(1);
    return `${countryCode}${phone}`;
  }
}
