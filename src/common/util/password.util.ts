import * as bcrypt from 'bcrypt';

export class PasswordUtil {
  static async hashBySalt(input: string): Promise<string> {
    return bcrypt.hash(input, 10);
  }

  static isBcryptHash(str: string): boolean {
    const bcryptHashPattern = /^\$2[ayb]\$\d{2}\$[./A-Za-z0-9]{53}$/;
    return bcryptHashPattern.test(str);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }
}
