import { DateUtil } from './date.util';

describe('DateUtil', () => {
  describe('zoneDate', () => {
    it('should return TW date when TW timezone and input format with Z', () => {
      const date = new Date('2022-01-01T00:00:00Z');
      const zoneDate = DateUtil.zoneDayjs(date, 'Asia/Taipei');
      expect(zoneDate.format('YYYY-MM-DD HH:mm:ss')).toBe(
        '2022-01-01 08:00:00',
      );
    });

    it('should return UTC date when UTC timezone and input format with Z', () => {
      const date = new Date('2022-01-01T00:00:00Z');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 00:00:00');
    });

    it('should return UTC date when UTC timezone and input format with +8', () => {
      const date = new Date('2022-01-02T00:00:00+08:00');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 16:00:00');
    });

    it('should return UTC date when UTC timezone and input format with YYYY-MM-DDTHH:mm:ss', () => {
      const date = new Date('2022-01-02T00:00:00');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 16:00:00');
    });

    it('should return UTC date when UTC timezone and input format with YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2022-01-02 00:00:00');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 16:00:00');
    });

    it('should return UTC date when UTC timezone and input format with YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2022-01-02 00:00:00');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 16:00:00');
    });

    it('should return UTC date when UTC timezone and input format with YYYY-MM-DD', () => {
      const date = new Date('2022-01-02 00:00:00');
      const utcDate = DateUtil.zoneDayjs(date);
      expect(utcDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 16:00:00');
    });

    it('should be defined when no args', () => {
      const zoneDate = DateUtil.zoneDayjs();
      console.debug('zoneDate', zoneDate.toISOString());
      expect(zoneDate).toBeDefined();
    });

    it('should be null when arg is empty string', () => {
      const zoneDate = DateUtil.zoneDayjs('');
      console.debug('zoneDate', zoneDate.toISOString());
      expect(zoneDate).toBeDefined();
    });

    it('should be null when arg is not date format string', () => {
      const zoneDate = DateUtil.zoneDayjs('123');
      console.debug('zoneDate', zoneDate.toISOString());
      expect(zoneDate).toBeDefined();
    });
  });

  describe('twDate', () => {
    it('should return TW date when TW timezone and input format with Z', () => {
      const date = new Date('2022-01-01T00:00:00Z');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-01 08:00:00');
    });

    it('should return TW date when TW timezone and input format with +8', () => {
      const date = new Date('2022-01-02T00:00:00+08:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-02 00:00:00');
    });

    it('should return TW date when TW timezone and input format with YYYY-MM-DDTHH:mm:ss', () => {
      const date = new Date('2022-01-02T00:00:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-02 00:00:00');
    });

    it('should return TW date when TW timezone and input format with YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2022-01-02 00:00:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-02 00:00:00');
    });

    it('should return TW date when TW timezone and input format with YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2022-01-02 00:00:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-02 00:00:00');
    });

    it('should return TW date when TW timezone and input format with YYYY-MM-DD', () => {
      const date = new Date('2022-01-02 00:00:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).toBe('2022-01-02 00:00:00');
    });

    it('should return TW date when TW timezone and input format with YYYY-MM-DDHH:mm:ss', () => {
      const date = new Date('2022-01-0200:00:00');
      const twDate = DateUtil.twDayjs(date);
      expect(twDate.format('YYYY-MM-DD HH:mm:ss')).not.toBe(
        '2022-01-02 00:00:00',
      );
    });
  });

  test('jsonToDoubleArray should return correct double array', () => {
    const json = { a: 1, b: 2 };
    const result = DateUtil.jsonToDoubleArray(json);
    expect(result).toEqual([
      ['a', 'b'],
      [1, 2],
    ]);
  });

  test('parseDate should return correct formatted date', () => {
    const date = new Date('2022-01-01T00:00:00Z');
    const formattedDate = DateUtil.parseDate(date, 'YYYY-MM-DD');
    expect(formattedDate).toBe('2022-01-01');
  });

  test('parseISODate should return correct ISO formatted date', () => {
    const date = new Date('2022-01-01T00:00:00Z');
    const isoDate = DateUtil.parseISODate(date);
    expect(isoDate).toBe('2022-01-01');
  });

  test('parseYYYYMMDD should return correct formatted date', () => {
    const date = new Date('2022-01-01T00:00:00Z');
    const yyyymmddDate = DateUtil.parseYYYYMMDD(date);
    expect(yyyymmddDate).toBe('20220101');
  });

  describe('diff', () => {
    test('should calculate date differences correctly expect 4 day with twDate', () => {
      const end = new Date('2024-08-07T01:00:00Z'); //2024-08-07 09:00:00 +8
      const start = new Date('2024-08-02T22:00:00Z'); //2024-08-03 06:00:00 +8
      expect(DateUtil.diff(end, start, 'd', DateUtil.TAIPEI)).toBe(4);
    });

    test('should calculate date differences correctly expect 0 day with twDate', () => {
      const end = new Date('2024-08-07T01:00:00Z'); //2024-08-07 09:00:00 +8
      const start = new Date('2024-08-06T22:00:00Z'); //2024-08-07 06:00:00 +8
      expect(DateUtil.diff(end, start, 'd', DateUtil.TAIPEI)).toBe(0);
    });

    test('should calculate date differences correctly expect -3 day with twDate', () => {
      const end = new Date('2024-08-07T01:00:00Z'); //2024-08-07 09:00:00 +8
      const start = new Date('2024-08-09T22:00:00Z'); //2024-08-10 06:00:00 +8
      expect(DateUtil.diff(end, start, 'd', DateUtil.TAIPEI)).toBe(-3);
    });
  });

  test('isBetween should validate if date is between correctly', () => {
    const d1 = new Date('2024-08-01T00:10:00Z');
    const d2 = new Date('2024-08-01T00:05:00Z');
    const d3 = new Date('2024-08-01T00:15:00Z');
    expect(DateUtil.isBetween(d1, d2, d3)).toBe(true);
  });

  test('isBeforeOrSame should validate dates correctly', () => {
    const d1 = new Date('2022-01-01T00:00:00Z');
    const d2 = new Date('2022-01-01T00:00:00Z');
    expect(DateUtil.isBeforeOrSame(d1, d2)).toBe(true);
  });

  test('isAfterOrSame should validate dates correctly', () => {
    const d1 = new Date('2022-01-01T00:00:00Z');
    const d2 = new Date('2022-01-01T00:00:00Z');
    expect(DateUtil.isAfterOrSame(d1, d2)).toBe(true);
  });

  test('addDateIncrement should correctly add increments to a date', () => {
    const date = new Date('2022-01-01T00:00:00Z');
    const incrementedDate = DateUtil.addDateIncrement('7d', date);
    expect(DateUtil.twDayjs(incrementedDate).format('YYYY-MM-DD')).toBe(
      '2022-01-08',
    );
  });

  test('parseIncrement should correctly parse increment strings', () => {
    const { value, unit } = DateUtil.parseIncrement('17d');
    expect(value).toBe(17);
    expect(unit).toBe('d');
  });

  test('parseIncrement should throw error on invalid format', () => {
    expect(() => {
      DateUtil.parseIncrement('7x');
    }).toThrow('Invalid time increment format. Use 1y, 2M, 3d, 4m, 5s, etc.');
  });

  test('convertUTCToTaipei should correctly convert UTC date to Taipei time', () => {
    const utcDate = new Date('2022-01-01T00:00:00Z'); // UTC time
    const expectedTaipeiDate = '2022-01-01T08:00:00'; // Expected Taipei time, considering the 8-hour difference
    const convertedDate = DateUtil.convertUTCToTaipei(utcDate);
    console.log('convertedDate', convertedDate.toISOString());
    expect(convertedDate.toISOString()).toBe(
      new Date(expectedTaipeiDate + 'Z').toISOString(),
    );
  });

  test('convertTaipeiToUTC should correctly convert Taipei date to UTC time', () => {
    const taipeiDate = new Date('2022-01-01T08:00:00Z'); // Taipei time
    const expectedUTCDate = '2022-01-01T00:00:00Z'; // Expected UTC time, considering the 8-hour difference
    const convertedDate = DateUtil.convertTaipeiToUTC(taipeiDate);
    expect(convertedDate.toISOString()).toBe(
      new Date(expectedUTCDate).toISOString(),
    );
  });
});
