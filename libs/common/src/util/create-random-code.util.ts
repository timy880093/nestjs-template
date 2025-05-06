import { v4 as uuidv4 } from 'uuid';

export function createRandomCode(): string {
  return uuidv4().slice(4, 23).toUpperCase();
}
