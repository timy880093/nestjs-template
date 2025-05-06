import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CommonValidator } from '../util/common-validator';
import { ValidatorUtil } from '../util/validator.util';

@ValidatorConstraint({ async: false })
export class IdNumberOrTaxIdConstraints
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    return (
      CommonValidator.isValidIdNumber(value) ||
      CommonValidator.isValidTaxId(value)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'invalid taxID format';
  }
}

export function IsIdNumberOrTaxId(validationOptions?: ValidationOptions) {
  return ValidatorUtil.registerDecorator(
    IdNumberOrTaxIdConstraints,
    validationOptions,
  );
}
