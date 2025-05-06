import { CommonException } from './common.exception';
import { ErrorTypes } from '../dto/error-code.const';

export class NotfoundException extends CommonException {
  constructor(
    message: string,
    errorCode: ErrorTypes = ErrorTypes.NOT_FOUND,
    e?: any,
  ) {
    super(message, errorCode, e);
  }
}
