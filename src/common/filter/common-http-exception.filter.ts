import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from '../dto/response.dto';
import { CommonException } from '../exception/common.exception';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch(HttpException)
export class CommonHttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(CommonHttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: CommonException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { method, url, params, body } = ctx.getRequest<Request>();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception.message;
    if (typeof exception.message === 'object') {
      message = JSON.stringify(exception.message, null, 2);
    }
    let responseBody = null;
    try {
      responseBody = ResponseDto.error(
        status,
        `${method} ${url}`,
        params,
        body,
        // message,
        [
          {
            code: exception.errorCode,
            message,
          },
        ],
      );
    } catch (e) {
      this.logger.error({ exception }, 'CommonHttpExceptionFilter(): ');
    }
    this.logger.error({ responseBody }, 'CommonHttpExceptionFilter(): ');

    response.status(status).json(responseBody);
  }
}
