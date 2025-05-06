import { ErrorTypes } from './error-code.const';

export interface ErrorDto {
  field?: string;
  code: ErrorTypes;
  message: string;
}
