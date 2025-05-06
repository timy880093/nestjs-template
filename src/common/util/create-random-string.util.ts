import { v4 as uuidv4 } from 'uuid';

export function createRandomString(length: number): string {
  const randomStr = uuidv4().split('-').join('').toUpperCase();
  return randomStr.slice(0, length);
}
