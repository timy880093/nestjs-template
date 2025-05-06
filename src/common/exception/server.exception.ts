import { ErrorTypes } from '../dto/error-code.const';
import { CommonException } from './common.exception';

export class ServerException extends CommonException {
  constructor(message: string, errorCode?: ErrorTypes, e?: any) {
    super(message, errorCode, e);
  }
}
