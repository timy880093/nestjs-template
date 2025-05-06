import { CommonException } from './common.exception';
import { ErrorTypes } from '../dto/error-code.const';

export class AdminException extends CommonException {
  constructor(message: string, errorCode?: ErrorTypes, e?: Error) {
    super(message, errorCode, e);
  }
}
