import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CommonValidator } from '../util/common-validator';
import { ValidatorUtil } from '../util/validator.util';

@ValidatorConstraint({ async: false })
export class IdNumberConstraints implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return CommonValidator.isValidIdNumber(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'invalid id_number format';
  }
}

export function IsIdNumber(validationOptions?: ValidationOptions) {
  return ValidatorUtil.registerDecorator(
    IdNumberConstraints,
    validationOptions,
  );
}
