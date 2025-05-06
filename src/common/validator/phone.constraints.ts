import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CommonUtil } from '../util/common.util';
import { CommonValidator } from '../util/common-validator';
import { ValidatorUtil } from '../util/validator.util';

@ValidatorConstraint({ async: false })
export class PhoneConstraints implements ValidatorConstraintInterface {
  validate(
    value: any = '',
    args?: ValidationArguments,
  ): Promise<boolean> | boolean {
    return CommonUtil.isArray(value)
      ? value.every((v: string) => CommonValidator.isPhoneStartWithZero(v))
      : CommonValidator.isPhoneStartWithZero(value);
  }

  defaultMessage?(args?: ValidationArguments): string {
    return `(${args.value}) must be phone format: 09xxxxxxxx`;
  }
}

export function IsPhoneOrPhoneArray(validationOptions?: ValidationOptions) {
  return ValidatorUtil.registerDecorator(PhoneConstraints, validationOptions);
}
