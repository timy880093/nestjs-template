import {
  registerDecorator,
  validate,
  ValidationError,
  ValidationOptions,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class ValidatorUtil {
  private static formatErrors(errors: ValidationError[]): ValidationError[] {
    return errors.map((error) => {
      return {
        property: error.property,
        constraints: error.constraints,
        children: error.children
          ? this.formatErrors(error.children)
          : undefined,
      };
    });
  }

  // 手動驗證
  static async validate(data: any) {
    const errors = await validate(data);
    if (errors?.length > 0) {
      // 格式化錯誤
      const formattedErrors = this.formatErrors(errors);
      const errorMessage = formattedErrors
        .map(
          ({ property, constraints }) =>
            `${property}: ${Object.values(constraints).join(', ')}`,
        )
        .join('; ');
      throw new BadRequestException(errorMessage);
    }
  }

  // 註冊自定義的驗證器，可傳入不同類型的 constraint 驗證方法
  static registerDecorator(
    validator: new (...args: any[]) => ValidatorConstraintInterface,
    validationOptions?: ValidationOptions,
  ) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator,
      });
    };
  }
}
