import { ErrorTypes } from '../dto/error-code.const';
import { CommonException } from './common.exception';

export class UploadException extends CommonException {
  constructor(message: string, errorCode?: ErrorTypes, e?: any) {
    super(message, errorCode, e);
  }
}
