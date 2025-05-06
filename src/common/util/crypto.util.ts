import { createHash } from 'crypto';

export class CryptoUtil {
  static generateSha256Hash(data: string, isUpperCase?: boolean): string {
    const hash = createHash('sha256').update(data).digest('hex');
    return isUpperCase ? hash.toUpperCase() : hash;
  }
}
