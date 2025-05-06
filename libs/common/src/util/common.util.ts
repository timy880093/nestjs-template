import _ from 'lodash';
import appConfig from '../../../../apps/new-project-template/src/config/app.config';
import { v4 as uuidv4 } from 'uuid';

export class CommonUtil {
  static isArray(arr?: any | any[]) {
    return _.isArray(arr) && arr.length > 0;
  }

  static findFirst(data?: any | any[]) {
    return CommonUtil.isArray(data) ? data[0] : data;
  }

  static toNumberArray(ids: any): number[] {
    return CommonUtil.isArray(ids) ? ids.map((id) => Number(id)) : [];
  }

  static toNumber(id: any): number {
    return id ? Number(id) : null;
  }

  static parseGarbled(text?: string) {
    return text ? Buffer.from(text, 'latin1').toString('utf8') : null;
  }

  static stringToEnum<T>(enumType: T, value: string): T[keyof T] | undefined {
    if (Object.values(enumType).includes(value as T[keyof T])) {
      return value as T[keyof T];
    }
    return undefined; // or handle the case where the string doesn't match any enum value
  }

  static convertJsonToObject(o: any) {
    if (!o) return null;
    switch (typeof o) {
      case 'string':
        return JSON.parse(o);
      default:
        return o;
    }
  }

  static isEnvProd(): boolean {
    const env = appConfig().env;
    //FIXME 是否要修改預設 env 邏輯
    if (!env || env === '') return true; // production/development 環境預設用 .env
    return ['production', 'production-local'].includes(env);
  }

  // 排序後比較兩個 array 是否相同
  static isSameArray(arr1: any[], arr2: any[]): boolean {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (arr1.length !== arr2.length) return false;
    // JSON.stringify 用來比較 object
    return _.isEqual(
      _.sortBy(arr1, JSON.stringify),
      _.sortBy(arr2, JSON.stringify),
    );
  }

  static genUuid(): string {
    return uuidv4().replace(/-/g, '');
  }
}
