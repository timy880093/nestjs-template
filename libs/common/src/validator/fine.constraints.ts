import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CommonValidator } from '../util/common-validator';

@ValidatorConstraint({ async: false })
export class FineConstraints implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return CommonValidator.isValidFine(value);
  }

  defaultMessage(args: ValidationArguments) {
    return 'invalid fine format';
  }
}

export function IsFine(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: FineConstraints,
    });
  };
}
