import { getLoggerToken } from 'nestjs-pino';
import { TestingModule } from '@nestjs/testing';

export class TestUtil {
  static mockLoggerProvider(name: string): any {
    return {
      provide: getLoggerToken(name),
      useValue: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    };
  }

  static mockLoggerInstance(module: TestingModule, name: string): any {
    return module.get(getLoggerToken(name));
  }

  static mockLoggerFunc(logger: any) {
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  }
}
