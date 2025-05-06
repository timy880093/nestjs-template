import {
  isEmail,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CommonUtil } from '../util/common.util';

@ValidatorConstraint({ async: false })
export class EmailConstraints implements ValidatorConstraintInterface {
  validate(
    value: any = '',
    args?: ValidationArguments,
  ): Promise<boolean> | boolean {
    return CommonUtil.isArray(value)
      ? value.every((v: string) => isEmail(v))
      : isEmail(value);
  }

  defaultMessage?(args?: ValidationArguments): string {
    return `(${args.value}) must be email format`;
  }
}

export function IsEmailOrEmailArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmailConstraints,
    });
  };
}
