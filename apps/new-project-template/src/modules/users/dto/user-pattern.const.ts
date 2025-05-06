import { ErrorUtil } from '../../../../../../libs/common/src/util';
import { RoleEnum } from './role.enum';

export const UserPattern = {
  username: {
    pattern: /^[0-9A-Za-z]{6,16}$/,
    message: ErrorUtil.invalid(
      'username',
      'must be 6-16 words and only contain number and lowercase and uppercase letter',
    ),
  },
  password: {
    pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[\s\S]{8,32}$/,
    message: ErrorUtil.invalid(
      'password',
      'must be 8-32 words and contain at least one uppercase letter, one lowercase letter and one number',
    ),
  },
  email: {
    message: ErrorUtil.invalid('email', 'must be a valid email address'),
  },
  phone: {
    message: ErrorUtil.invalidPhone('phone'),
  },
  role: {
    message: ErrorUtil.invalid(
      'role',
      `must be one of [${Object.values(RoleEnum)}]`,
    ),
  },
  ref: {
    message: ErrorUtil.invalid('ref', `must be string`),
  },
};
