// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   HttpStatus,
// } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { ResponseDto } from '../dto/response.dto';
//
// @Catch()
// export class GlobalExceptionsFilter implements ExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const { path, params, body } = ctx.getRequest<Request>();
//     const status =
//       exception instanceof HttpException
//         ? exception.getStatus()
//         : HttpStatus.INTERNAL_SERVER_ERROR;
//     const responseDto = ResponseDto.error(
//       status,
//       path,
//       params,
//       body,
//       'Internal Server Error',
//     );
//     console.log(`${exception.constructor.name}: ${responseDto}`);
//
//     response.status(status).json();
//   }
// }
