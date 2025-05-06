import { CommonException } from './common.exception';
import { ErrorTypes } from '../dto/error-code.const';

export class GiftCardException extends CommonException {
  constructor(message: string, errorCode: ErrorTypes = ErrorTypes.INVALID) {
    super(message, errorCode);
  }
}
