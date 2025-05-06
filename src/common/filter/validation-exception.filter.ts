import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CommonUtil } from '../util';
import _ from 'lodash';
import { ErrorTypes } from '../dto/error-code.const';
import { ErrorDto } from '../dto/error.dto';
import { ResponseDto } from '../dto/response.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

// 只處理 validate-pipe 的錯誤
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(ValidationExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse: any = exception.getResponse();
    const validationErrors = this.parseErrors(exceptionResponse.message);

    const responseBody = ResponseDto.error(
      status,
      request.url,
      request.params,
      request.body,
      validationErrors,
    );
    this.logger.error({ responseBody }, 'ValidationExceptionFilter(): ');

    response.status(status).json(responseBody);

    //     // 自定義返回格式，這裡我們將所有的驗證錯誤信息整理後返回
    // const formattedErrors = errors.map(err => ({
    //   field: err.property, // 對應的欄位名稱
    //   errors: Object.values(err.constraints), // 具體的錯誤信息
    // }));
    //
    // response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
    //   statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    //   message: 'Validation failed',
    //   errors: formattedErrors,
    // });
  }

  parseErrors(errors: any, separator = '|'): ErrorDto[] {
    if (!CommonUtil.isArray(errors)) errors = [errors];
    return errors.map((error) => {
      if (!_.isString(error) || !error.includes(separator)) return error;
      const s = error.split(separator);
      return {
        field: s[0],
        code: ErrorTypes[s[1]],
        message: s[2],
      };
    });
  }
}
