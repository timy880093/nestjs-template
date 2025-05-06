import { ErrorTypes } from '../dto/error-code.const';

export class ErrorUtil {
  static invalid(field: string, message: string): string {
    return `${field}|${ErrorTypes.INVALID}|${message}`;
  }

  static invalidBoolean(field: string): string {
    return this.invalid(field, 'must be "true" or "false"');
  }

  static invalidDate(field: string): string {
    return this.invalid(field, 'must be a valid date');
  }

  static invalidPhone(field: string): string {
    return this.invalid(field, 'must be like 09xxxxxxxx');
  }

  static invalidEmail(field: string): string {
    return this.invalid(field, 'must be a valid email address');
  }

  static invalidNumber(field: string): string {
    return this.invalid(field, 'must be a valid number');
  }

  static invalidString(field: string): string {
    return this.invalid(field, 'must be a valid string');
  }

  static notFound(field: string): string {
    return `${field}|${ErrorTypes.NOT_FOUND}|not found`;
  }

  static duplicated(field: string): string {
    return `${field}|${ErrorTypes.DUPLICATED}|duplicated`;
  }
}
