import { CommonUtil } from './common.util';

describe('CommonUtil', () => {
  describe('isSameArray', () => {
    it('returns true for arrays with same numbers', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [3, 2, 1];
      expect(CommonUtil.isSameArray(arr1, arr2)).toBe(true);
    });

    it('returns true for arrays with same strings', () => {
      const arr1 = ['apple', 'banana', 'cherry'];
      const arr2 = ['cherry', 'banana', 'apple'];
      expect(CommonUtil.isSameArray(arr1, arr2)).toBe(true);
    });

    it('returns true for arrays with mixed types', () => {
      const arr1 = [1, 'apple', { id: 1 }];
      const arr2 = [{ id: 1 }, 'apple', 1];
      expect(CommonUtil.isSameArray(arr1, arr2)).toBe(true);
    });

    it('returns true for arrays with nested objects', () => {
      const arr1 = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];
      const arr2 = [
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' },
      ];
      expect(CommonUtil.isSameArray(arr1, arr2)).toBe(true);
    });

    it('returns false for arrays with different structures', () => {
      const arr1 = [1, 'apple', { id: 1 }];
      const arr2 = [1, 'apple', { id: 2 }];
      expect(CommonUtil.isSameArray(arr1, arr2)).toBe(false);
    });
  });

  describe('genUuid', () => {
    it('should length be correct', () => {
      const uuid = CommonUtil.genUuid();
      console.log(uuid);
      expect(uuid.length).toBe(32);
      // const arr = [];
      // for (let i = 0; i < 13; i++) {
      //   const uuid = CommonUtil.genUuid();
      //   arr.push(uuid);
      // }
      // console.log(arr);
    });
  });
});
