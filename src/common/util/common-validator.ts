import { CommonUtil } from './common.util';
import { BadRequestException } from '@nestjs/common';
import { isEmail, isMobilePhone, ValidationError } from 'class-validator';
import * as ValidatorJS from 'validator';

export class CommonValidator {
  private static readonly letterMap = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33,
  };

  static isValidIdNumber(value: any) {
    // 檢查長度和格式
    if (!/^[A-Z][1-2]\d{8}$/.test(value)) {
      return false;
    }

    // 計算檢查碼
    let sum =
      Math.floor(this.letterMap[value[0]] / 10) +
      (this.letterMap[value[0]] % 10) * 9;

    for (let i = 1; i < 9; i++) {
      sum += parseInt(value[i]) * (9 - i);
    }

    sum += parseInt(value[9]);

    // 驗證結果
    return sum % 10 === 0;
  }

  static isValidTaxId(value: any) {
    if (!/^\d{8}$/.test(value)) {
      return false;
    }

    const weights = [1, 2, 1, 2, 1, 2, 4, 1];
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      const digit = parseInt(value[i]);
      const product = digit * weights[i];
      sum += Math.floor(product / 10) + (product % 10);
    }

    // 特殊情況處理
    if (value[6] === '7' && sum % 10 === 0) {
      return true;
    }

    return sum % 10 === 0 || (sum + 1) % 10 === 0;
  }

  static throwException(validationErrors: ValidationError[]) {
    if (CommonUtil.isArray(validationErrors)) {
      const formattedErrors = validationErrors.map((error) => ({
        property: error.property,
        errors: Object.values(error.constraints),
      }));

      throw new BadRequestException({
        statusCode: 400,
        message: formattedErrors,
        error: 'Bad Request',
      });
    }
  }

  static isValidFine(fine: number) {
    try {
      return fine > 0 && fine % 100 === 0;
    } catch (e) {
      console.log('isValidFine error:', e);
      return false;
    }
  }

  // 09xxxxxxxx
  static isPhoneStartWithZero(phone: string): boolean {
    return /^09\d{8}$/.test(phone);
  }

  // +8869xxxxxxxx
  static isPhoneStartWithCountryCode(
    phone: string,
    countryCode: ValidatorJS.MobilePhoneLocale = 'zh-TW',
  ): boolean {
    return isMobilePhone(phone, countryCode);
  }

  static isEmail(email: string): boolean {
    // class-validator isEmail
    return isEmail(email);
  }
}
