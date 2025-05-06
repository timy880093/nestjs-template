import { ErrorUtil } from '../../../common/util/error.util';

export const TicketPattern = {
  isTicketPaid: {
    message: ErrorUtil.invalidBoolean('isTicketPaid'),
  },
  expiresAt: {
    message: ErrorUtil.invalidDate('expiresAt'),
  },
  isCompanyCar: {
    message: ErrorUtil.invalidBoolean('isCompanyCar'),
  },
  assignedOfficeCity: {
    message: ErrorUtil.invalid('assignedOfficeCity', 'must be a valid city'),
  },
  isTicketAssignedToDriver: {
    message: ErrorUtil.invalidBoolean('isTicketAssignedToDriver'),
  },
  ticketType: {
    message: ErrorUtil.invalid('ticketType', 'must be a valid ticket type'),
  },
  ticketInfoFileIds: {
    message: ErrorUtil.invalid('ticketInfoFileIds', 'must be an array'),
  },
  violationFileIds: {
    message: ErrorUtil.invalid('violationFileIds', 'must be an array'),
  },
  ownerPhone: {
    message: ErrorUtil.invalidPhone('ownerPhone'),
  },
  driverPhone: {
    message: ErrorUtil.invalidPhone('driverPhone'),
  },
  ownerIdNo: {
    message: ErrorUtil.invalid('ownerIdNo', 'must be a valid id number'),
  },
  driverIdNo: {
    message: ErrorUtil.invalid('driverIdNo', 'must be a valid id number'),
  },
  violation1Article: {
    message: ErrorUtil.invalidNumber('violation1Article'),
  },
  violation1Item: {
    message: ErrorUtil.invalidNumber('violation1Item'),
  },
  violation1Clause: {
    message: ErrorUtil.invalidNumber('violation1Clause'),
  },
  violation2Article: {
    message: ErrorUtil.invalidNumber('violation2Article'),
  },
  violation2Item: {
    message: ErrorUtil.invalidNumber('violation2Item'),
  },
  violation2Clause: {
    message: ErrorUtil.invalidNumber('violation2Clause'),
  },
  ticketNo: {
    pattern: /^(?=.*[A-Z])[A-Z0-9]{9}$/,
    message: ErrorUtil.invalid('ticketNo', 'must be a valid ticket number'),
  },
  licensePlateNo: {
    pattern: /^[A-Z\d]{2,5}-[A-Z\d]{2,5}$/,
    message: ErrorUtil.invalid(
      'licensePlateNo',
      'must be a valid license plate number',
    ),
  },
};
