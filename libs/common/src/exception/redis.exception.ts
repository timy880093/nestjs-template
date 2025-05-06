import { CommonException } from './common.exception';
import { ErrorTypes } from '../dto/error-code.const';

export class RedisException extends CommonException {
  constructor(message: string, errorCode?: ErrorTypes, e?: any) {
    super(message, errorCode, e);
  }
}
