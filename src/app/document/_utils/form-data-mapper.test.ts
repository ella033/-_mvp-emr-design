import { describe, it, expect } from 'vitest';
import { mapSnapshotToFormData, mapFormDataToSnapshot } from './form-data-mapper';

describe('mapSnapshotToFormData', () => {
  it('plain object를 그대로 반환한다', () => {
    const snapshot = { name: '홍길동', age: 30 };
    expect(mapSnapshotToFormData({ snapshot })).toEqual(snapshot);
  });

  it('null이면 빈 객체를 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: null })).toEqual({});
  });

  it('undefined이면 빈 객체를 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: undefined })).toEqual({});
  });

  it('배열이면 빈 객체를 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: [1, 2, 3] })).toEqual({});
  });

  it('문자열이면 빈 객체를 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: 'string' })).toEqual({});
  });

  it('숫자이면 빈 객체를 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: 42 })).toEqual({});
  });

  it('빈 plain object를 그대로 반환한다', () => {
    expect(mapSnapshotToFormData({ snapshot: {} })).toEqual({});
  });

  it('중첩된 plain object를 그대로 반환한다', () => {
    const snapshot = { patient: { name: '홍길동' }, items: [1, 2] };
    expect(mapSnapshotToFormData({ snapshot })).toEqual(snapshot);
  });
});

describe('mapFormDataToSnapshot', () => {
  describe('plain object 입력', () => {
    it('plain object를 { values: ... } 형태로 래핑한다', () => {
      const formData = { name: '홍길동', age: '30' };
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '홍길동', age: '30' },
      });
    });

    it('빈 객체면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot({})).toEqual({ values: {} });
    });
  });

  describe('배열 입력 ([{ key, value }])', () => {
    it('key-value 배열을 flat 객체로 변환한다', () => {
      const formData = [
        { key: 'name', value: '홍길동' },
        { key: 'age', value: 30 },
      ];
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '홍길동', age: 30 },
      });
    });

    it('key가 없는 항목은 무시한다', () => {
      const formData = [
        { key: 'name', value: '홍길동' },
        { value: '무시됨' },
        { notKey: 'x', value: 'y' },
      ];
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '홍길동' },
      });
    });

    it('빈 배열이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot([])).toEqual({ values: {} });
    });

    it('null 항목은 무시한다', () => {
      const formData = [null, { key: 'name', value: '테스트' }, undefined];
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '테스트' },
      });
    });
  });

  describe('JSON 문자열 입력', () => {
    it('JSON 문자열을 파싱하여 처리한다 (object)', () => {
      const formData = JSON.stringify({ name: '홍길동' });
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '홍길동' },
      });
    });

    it('JSON 배열 문자열을 파싱하여 처리한다', () => {
      const formData = JSON.stringify([{ key: 'name', value: '홍길동' }]);
      expect(mapFormDataToSnapshot(formData)).toEqual({
        values: { name: '홍길동' },
      });
    });

    it('유효하지 않은 JSON 문자열이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot('not json')).toEqual({ values: {} });
    });
  });

  describe('잘못된 입력', () => {
    it('null이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot(null)).toEqual({ values: {} });
    });

    it('undefined이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot(undefined)).toEqual({ values: {} });
    });

    it('숫자이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot(42)).toEqual({ values: {} });
    });

    it('boolean이면 빈 values를 반환한다', () => {
      expect(mapFormDataToSnapshot(true)).toEqual({ values: {} });
    });
  });
});
