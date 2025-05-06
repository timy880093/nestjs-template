import dayjs, { Dayjs, ManipulateType } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DateUtil {
  static readonly TAIPEI = 'Asia/Taipei';

  // 沒有日期時，預設當前日期
  static zoneDayjs(date?: Date | string, zone?: string): Dayjs {
    if (dayjs(date).isValid())
      return zone ? dayjs(date).tz(zone) : dayjs.utc(date);
    else return dayjs.utc();
  }

  static twDayjs(date?: Date | string): Dayjs {
    return this.zoneDayjs(date, this.TAIPEI);
  }

  static jsonToDoubleArray(json: Record<string, any>): any[][] {
    return [Object.keys(json), Object.values(json)];
  }

  static parseDate(date: Date | string, format: string | null = null): string {
    return this.zoneDayjs(date).format(format);
  }

  static parseISODate(date: Date | string): string {
    return this.parseDate(date, 'YYYY-MM-DD');
  }

  static parseYYYYMMDD(date: Date | string): string {
    return this.parseDate(date, 'YYYYMMDD');
  }

  static diff(
    end: Date,
    start?: Date,
    unit?: dayjs.OpUnitType,
    zone?: string,
  ): number {
    const startDayjs = this.zoneDayjs(start, zone);
    const endDayjs = this.zoneDayjs(end, zone);
    return endDayjs.startOf(unit).diff(startDayjs.startOf(unit), unit);
  }

  static diffTaipei(end: Date, start?: Date, unit?: dayjs.OpUnitType): number {
    return this.diff(end, start, unit, this.TAIPEI);
  }

  static isBetween(source: Date, start: Date, end: Date): boolean {
    if (!source || !start || !end) return false;
    if (this.zoneDayjs(start).isAfter(this.zoneDayjs(end))) {
      const temp = start;
      start = end;
      end = temp;
    }
    return (
      this.isBeforeOrSame(source, end) && this.isAfterOrSame(source, start)
    );
  }

  static isBeforeOrSame(source: Date, target: Date): boolean {
    return (
      this.zoneDayjs(source).isBefore(this.zoneDayjs(target)) ||
      this.zoneDayjs(source).isSame(this.zoneDayjs(target))
    );
  }

  static isAfterOrSame(source: Date, target: Date): boolean {
    return (
      this.zoneDayjs(source).isAfter(this.zoneDayjs(target)) ||
      this.zoneDayjs(source).isSame(this.zoneDayjs(target))
    );
  }

  static addDateIncrement(increment: string, date?: Date | string): Date {
    const now = this.zoneDayjs(date);
    const { value, unit } = this.parseIncrement(increment);
    return now.add(value, unit).toDate();
  }

  static parseIncrement(increment: string): {
    value: number;
    unit: ManipulateType;
  } {
    const regex = /(\d+)([yMdms])/;
    const matches = increment.match(regex);
    if (!matches) {
      throw new Error(
        'Invalid time increment format. Use 1y, 2M, 3d, 4m, 5s, etc.',
      );
    }
    return {
      value: parseInt(matches[1]),
      unit: matches[2] as ManipulateType,
    };
  }

  static convertUTCToTaipei(date: Date | string): Date {
    const dayjsDate = this.twDayjs(date);
    return dayjsDate.add(8, 'hour').toDate();
  }

  static convertTaipeiToUTC(date: Date | string): Date {
    const dayjsDate = this.twDayjs(date);
    return dayjsDate.subtract(8, 'hour').toDate();
  }
}
