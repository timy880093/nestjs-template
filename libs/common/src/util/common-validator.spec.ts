import { CommonValidator } from './common-validator';

describe('CommonValidator', () => {
  describe('isValidIdNumber', () => {
    it('should return true for a valid ID number', () => {
      expect(CommonValidator.isValidIdNumber('A123456789')).toBe(true);
    });

    it('should return false for an invalid ID number', () => {
      expect(CommonValidator.isValidIdNumber('123')).toBe(false);
      expect(CommonValidator.isValidIdNumber('A12345678')).toBe(false);
    });
  });

  describe('isValidTaxId', () => {
    it('should return true for a valid tax ID', () => {
      expect(CommonValidator.isValidTaxId('90118769')).toBe(true);
      expect(CommonValidator.isValidTaxId('24549210')).toBe(true);
    });

    it('should return false for an invalid tax ID', () => {
      expect(CommonValidator.isValidTaxId('1234567')).toBe(false);
      expect(CommonValidator.isValidTaxId('abcdefgh')).toBe(false);
      expect(CommonValidator.isValidTaxId(null)).toBe(false);
    });
  });
});
