import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildRhfDefaultsFromFields } from './form-initialization';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

vi.mock('@/lib/field-converters', () => ({
  applyConverter: vi.fn((value: unknown, converter: string) => {
    if (converter === 'rrnToMasked') return `masked(${value})`;
    return value;
  }),
}));

function makeField(
  overrides: Partial<FormFieldDto> & { key: string; defaultValue?: unknown; options?: any }
): FormFieldDto {
  return {
    id: 1,
    formVersionId: 1,
    key: overrides.key,
    label: overrides.key,
    type: overrides.type ?? 1, // TEXT
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    page: 1,
    options: overrides.options ?? null,
    ...overrides,
    defaultValue: overrides.defaultValue,
  } as unknown as FormFieldDto;
}

describe('buildRhfDefaultsFromFields', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('빈 필드 배열이면 빈 객체를 반환한다', () => {
    expect(buildRhfDefaultsFromFields([])).toEqual({});
  });

  it('defaultValue가 없는 필드는 결과에 포함하지 않는다', () => {
    const fields = [makeField({ key: 'name' })];
    expect(buildRhfDefaultsFromFields(fields)).toEqual({});
  });

  it('문자열 defaultValue를 그대로 반환한다', () => {
    const fields = [makeField({ key: 'name', defaultValue: '홍길동' })];
    expect(buildRhfDefaultsFromFields(fields)).toEqual({ name: '홍길동' });
  });

  it('빈 문자열 defaultValue는 결과에 포함하지 않는다', () => {
    const fields = [makeField({ key: 'name', defaultValue: '' })];
    expect(buildRhfDefaultsFromFields(fields)).toEqual({});
  });

  describe('{{today}} 토큰', () => {
    it('오늘 날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
      const fields = [makeField({ key: 'visitDate', defaultValue: '{{today}}' })];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        visitDate: '2026-03-04',
      });
    });

    it('dateSplit year 옵션이면 연도만 반환한다', () => {
      const fields = [
        makeField({
          key: 'year',
          defaultValue: '{{today}}',
          options: { dateSplit: { groupId: 'date1', part: 'year' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ year: '2026' });
    });

    it('dateSplit month 옵션이면 월만 반환한다', () => {
      const fields = [
        makeField({
          key: 'month',
          defaultValue: '{{today}}',
          options: { dateSplit: { groupId: 'date1', part: 'month' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ month: '03' });
    });

    it('dateSplit day 옵션이면 일만 반환한다', () => {
      const fields = [
        makeField({
          key: 'day',
          defaultValue: '{{today}}',
          options: { dateSplit: { groupId: 'date1', part: 'day' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ day: '04' });
    });
  });

  describe('{{now}} 토큰', () => {
    it('DATETIME 필드이면 ISO datetime-local 형식을 반환한다', () => {
      const fields = [makeField({ key: 'createdAt', type: 4, defaultValue: '{{now}}' })];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        createdAt: '2026-03-04T14:30',
      });
    });

    it('TEXT 필드이면 YYYY-MM-DD 형식을 반환한다', () => {
      const fields = [makeField({ key: 'createdAt', type: 1, defaultValue: '{{now}}' })];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        createdAt: '2026-03-04',
      });
    });

    it('dateSplit 옵션과 함께 사용하면 해당 part를 반환한다', () => {
      const fields = [
        makeField({
          key: 'hour_year',
          defaultValue: '{{now}}',
          options: { dateSplit: { groupId: 'g1', part: 'year' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ hour_year: '2026' });
    });
  });

  describe('객체 형태 defaultValue', () => {
    it('template 프로퍼티를 추출한다', () => {
      const fields = [
        makeField({ key: 'field1', defaultValue: { template: '{{today}}' } }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        field1: '2026-03-04',
      });
    });

    it('value 프로퍼티를 추출한다', () => {
      const fields = [
        makeField({ key: 'field1', defaultValue: { value: '테스트값' } }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        field1: '테스트값',
      });
    });

    it('template과 value 모두 없으면 결과에 포함하지 않는다', () => {
      const fields = [
        makeField({ key: 'field1', defaultValue: { unknown: 'data' } }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({});
    });
  });

  describe('dateSplit + 날짜 문자열 defaultValue', () => {
    it('YYYY-MM-DD 형식에서 year를 추출한다', () => {
      const fields = [
        makeField({
          key: 'year',
          defaultValue: '2025-07-15',
          options: { dateSplit: { groupId: 'g1', part: 'year' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ year: '2025' });
    });

    it('YYYY.MM.DD 형식에서 month를 추출한다', () => {
      const fields = [
        makeField({
          key: 'month',
          defaultValue: '2025.07.15',
          options: { dateSplit: { groupId: 'g1', part: 'month' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ month: '07' });
    });

    it('YYYY/MM/DD 형식에서 day를 추출한다', () => {
      const fields = [
        makeField({
          key: 'day',
          defaultValue: '2025/07/15',
          options: { dateSplit: { groupId: 'g1', part: 'day' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({ day: '15' });
    });
  });

  describe('converter 옵션', () => {
    it('converter가 있으면 변환된 값을 반환한다', () => {
      const fields = [
        makeField({
          key: 'rrn',
          defaultValue: '900101-1234567',
          options: { converter: 'rrnToMasked' },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        rrn: 'masked(900101-1234567)',
      });
    });

    it('빈 값에는 converter를 적용하지 않는다', () => {
      const fields = [
        makeField({
          key: 'rrn',
          defaultValue: '',
          options: { converter: 'rrnToMasked' },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({});
    });
  });

  describe('여러 필드 조합', () => {
    it('여러 필드의 기본값을 올바르게 처리한다', () => {
      const fields = [
        makeField({ key: 'name', defaultValue: '홍길동' }),
        makeField({ key: 'visitDate', defaultValue: '{{today}}' }),
        makeField({ key: 'empty', defaultValue: '' }),
        makeField({ key: 'noDefault' }),
      ];
      const result = buildRhfDefaultsFromFields(fields);
      expect(result).toEqual({
        name: '홍길동',
        visitDate: '2026-03-04',
      });
      expect(result).not.toHaveProperty('empty');
      expect(result).not.toHaveProperty('noDefault');
    });
  });

  describe('잘못된 dateSplit 옵션', () => {
    it('dateSplit에 groupId가 없으면 일반 값으로 처리한다', () => {
      const fields = [
        makeField({
          key: 'field',
          defaultValue: '{{today}}',
          options: { dateSplit: { part: 'year' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        field: '2026-03-04',
      });
    });

    it('dateSplit.part가 유효하지 않으면 일반 값으로 처리한다', () => {
      const fields = [
        makeField({
          key: 'field',
          defaultValue: '{{today}}',
          options: { dateSplit: { groupId: 'g1', part: 'invalid' } },
        }),
      ];
      expect(buildRhfDefaultsFromFields(fields)).toEqual({
        field: '2026-03-04',
      });
    });
  });
});
