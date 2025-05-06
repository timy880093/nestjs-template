import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TicketUpdateReq } from '../../modules/ticket/dto/ticket-update.req';

@ValidatorConstraint({ async: false })
export class BirthdateConstraints implements ValidatorConstraintInterface {
  validate(dto: TicketUpdateReq, args: ValidationArguments): boolean {
    const {
      isCompanyCar,
      isOwnerSameAsDriver,
      isTicketAssignedToDriver,
      ownerName,
      ownerIdNo,
      ownerBirthdate,
      driverName,
      driverIdNo,
      driverBirthdate,
    } = dto;

    if (isCompanyCar) {
      // 公司車
      // 已歸責：車主生日不能填、駕駛人生日必填
      // 未歸責：都不能填
      return isTicketAssignedToDriver
        ? !ownerBirthdate && !!driverBirthdate
        : !ownerBirthdate && !driverBirthdate;
    } else {
      // 非公司車
      // 車主與駕駛人相同：車主必填
      // 不同：車主與駕駛人必填
      return isOwnerSameAsDriver
        ? !!ownerBirthdate
        : !!ownerBirthdate && !!driverBirthdate;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return '車主生日or駕駛生日有誤';
  }
}

export function ValidateBirthdate(validationOptions?: ValidationOptions) {
  return function (target: any) {
    registerDecorator({
      target: target.constructor,
      propertyName: undefined,
      options: validationOptions,
      validator: BirthdateConstraints,
    });
  };
}
