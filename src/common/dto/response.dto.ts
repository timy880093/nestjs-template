import { HttpStatus } from '@nestjs/common';
import { ErrorDto } from './error.dto';

export class ResponseDto {
  isSuccess: boolean;
  path: string;
  params: any;
  body: any;
  status: HttpStatus;
  message: string;
  data: any;
  errors: ErrorDto | ErrorDto[];

  constructor(data: Partial<ResponseDto>) {
    Object.assign(this, data);
  }

  static success(path: string, data?: Record<string, any>) {
    return new ResponseDto({
      isSuccess: true,
      path,
      status: HttpStatus.OK,
      message: 'success',
      data,
    });
  }

  static error(
    status: HttpStatus,
    path: string,
    params: any,
    body: any,
    error?: ErrorDto[],
  ) {
    return new ResponseDto({
      isSuccess: false,
      path,
      params,
      body,
      status,
      errors: error,
    });
  }
}
