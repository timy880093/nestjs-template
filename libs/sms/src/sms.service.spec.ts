import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import smsConfig from '../../../apps/new-project-template/src/config/sms.config';
import { ConfigModule } from '@nestjs/config';

describe('SmsService', () => {
  let service: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [smsConfig],
        }),
      ],
      providers: [
        SmsService,
        // {
        //   provide: SmsService,
        //   useValue: {
        //     send: jest.fn(),
        //     mobileNumberFormatter: jest.fn(),
        //   },
        // },
        {
          provide: smsConfig.KEY,
          useValue: {
            e8dUid: 'test',
            e8dPwd: 'test',
          },
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service['twCountryCode']).toBe('+886');
  });

  it('should have correct inject values', () => {
    expect(service['e8dUid']).toBe('test');
    expect(service['e8dPwd']).toBe('test');
  });

  it('should send SMS to all phones successfully', async () => {
    const phones = ['0912345678', '0987654321'];
    const subject = 'Test Subject';
    const text = 'Test Message';

    // 模拟send 方法返回 null（无错误）
    // (service.send as jest.Mock).mockResolvedValue(null);
    const sendSpy = jest.spyOn(service, 'send').mockResolvedValue(null);

    const result = await service.sendText({ phones, subject, text });

    expect(sendSpy).toHaveBeenCalledTimes(phones.length);
    phones.forEach((phone) => {
      expect(sendSpy).toHaveBeenCalledWith({
        to: service.mobileNumberFormatter(service['twCountryCode'], phone),
        subject,
        text,
      });
    });
    expect(result.totalCount).toBe(phones.length);
    expect(result.sendSmsErrors).toEqual([]);
  });

  it('should collect errors when some SMS fail to send', async () => {
    const phones = ['0912345678', '0987654321'];
    const subject = 'Test Subject';
    const text = 'Test Message';

    // 第一个发送成功，第二个发送失败
    const sendSpy = jest
      .spyOn(service, 'send')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ phone: phones[1], message: 'Send failed' });

    const result = await service.sendText({ phones, subject, text });

    expect(sendSpy).toHaveBeenCalledTimes(phones.length);

    expect(result.totalCount).toBe(phones.length);
    expect(result.sendSmsErrors.length).toBe(1);
    expect(result.sendSmsErrors[0].message).toBe('Send failed');
  });

  it('should handle empty phones array', async () => {
    const phones: string[] = [];
    const subject = 'Test Subject';
    const text = 'Test Message';

    const sendSpy = jest.spyOn(service, 'send');

    const result = await service.sendText({ phones, subject, text });

    expect(sendSpy).not.toHaveBeenCalled();
    expect(result.totalCount).toBe(0);
    expect(result.sendSmsErrors).toEqual([]);
  });

  it('should format phone numbers correctly', async () => {
    const phones = ['0912345678'];
    const subject = 'Test Subject';
    const text = 'Test Message';

    const sendSpy = jest.spyOn(service, 'send').mockResolvedValue(null);

    const result = await service.sendText({ phones, subject, text });

    expect(sendSpy).toHaveBeenCalledWith({
      to: service.mobileNumberFormatter(service['twCountryCode'], phones[0]),
      subject,
      text,
    });
    expect(result.totalCount).toBe(1);
    expect(result.sendSmsErrors).toEqual([]);
  });
});
