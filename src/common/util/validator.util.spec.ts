import { BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { ValidatorUtil } from './validator.util'; // 假設您的文件名為 validator.util.ts

jest.mock('class-validator', () => ({
  validate: jest.fn(),
}));

describe('ValidatorUtil', () => {
  describe('validate', () => {
    it('should not throw an error if validation passes', async () => {
      const data = { name: 'John Doe', age: 30 }; // 假設這是有效數據

      (validate as jest.Mock).mockResolvedValueOnce([]); // 模擬驗證通過

      await expect(ValidatorUtil.validate(data)).resolves.not.toThrow();
    });

    it('should throw BadRequestException if validation fails', async () => {
      const data = { name: '', age: 'not a number' }; // 假設這是無效數據
      const errors: ValidationError[] = [
        {
          property: 'name',
          constraints: { isNotEmpty: 'name should not be empty' },
          children: [],
        },
        {
          property: 'age',
          constraints: { isInt: 'age must be an integer' },
          children: [],
        },
      ];

      (validate as jest.Mock).mockResolvedValueOnce(errors); // 模擬驗證失敗

      // 捕獲錯誤並檢查內容
      try {
        await ValidatorUtil.validate(data);
      } catch (error) {
        console.log('error: ', error);
        // 檢查錯誤類型
        expect(error).toBeInstanceOf(BadRequestException);
        // 比對幾個欄位錯誤
        expect(error.response.message.split(';').length).toBe(errors.length);
      }
    });
  });
});
