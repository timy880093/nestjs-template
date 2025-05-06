import { HttpException } from '@nestjs/common';
import { ErrorTypes, ErrorTypeToHttpCode } from '../dto/error-code.const';

export class CommonException extends HttpException {
  errorCode: ErrorTypes;

  constructor(message: string, errorCode?: ErrorTypes, e?: any) {
    const msg = e?.message || message;
    const code = e?.errorCode || errorCode || ErrorTypes.INVALID;
    const status = ErrorTypeToHttpCode[code];
    super(msg, status);
    this.errorCode = code;
  }
}
