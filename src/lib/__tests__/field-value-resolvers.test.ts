import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveFieldValue,
  ValueResolver,
  type ValueResolverContext,
} from '../field-value-resolvers';
import type { Encounter } from '@/types/chart/encounter-types';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

// ── 헬퍼 ────────────────────────────────────────────────

/** 최소 FormFieldDto 생성 */
function makeField(overrides: Partial<FormFieldDto> = {}): FormFieldDto {
  return {
    id: 1,
    key: 'test-field',
    label: 'Test',
    fieldType: 'TEXT',
    required: false,
    sortOrder: 0,
    ...overrides,
  } as FormFieldDto;
}

/** 최소 Encounter 생성 */
function makeEncounter(overrides: Partial<Encounter> = {}): Encounter {
  return {
    id: 1,
    startDateTime: '2024-01-15T10:00:00',
    ...overrides,
  } as Encounter;
}

// ── 테스트 ──────────────────────────────────────────────

describe('resolveFieldValue', () => {
  describe('resolver가 없는 경우', () => {
    it('options에 resolver가 없으면 null 반환', () => {
      const field = makeField({ options: {} });
      const result = resolveFieldValue(field, {});
      expect(result).toBeNull();
    });

    it('options가 undefined이면 null 반환', () => {
      const field = makeField({ options: undefined });
      const result = resolveFieldValue(field, {});
      expect(result).toBeNull();
    });

    it('알 수 없는 resolver 키이면 null 반환 (경고 출력)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const field = makeField({
        options: { resolver: 'unknown.resolver' } as any,
      });
      const result = resolveFieldValue(field, {});
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown.resolver')
      );
      warnSpy.mockRestore();
    });
  });

  describe('내원이력 resolver', () => {
    const encounters: Encounter[] = [
      makeEncounter({
        id: 1,
        startDateTime: '2024-01-10T09:00:00',
        encounterDateTime: '2024-01-10',
      }),
      makeEncounter({
        id: 2,
        startDateTime: '2024-01-20T14:00:00',
        encounterDateTime: '2024-01-20',
      }),
    ];

    const context: ValueResolverContext = {
      appliedEncounters: encounters,
    };

    it('VISIT_DATES: 내원일 목록 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_DATES } as any,
      });
      const result = resolveFieldValue(field, context);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('VISIT_FIRST_DATE: 첫 내원일 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_FIRST_DATE } as any,
      });
      const result = resolveFieldValue(field, context);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('VISIT_LAST_DATE: 마지막 내원일 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_LAST_DATE } as any,
      });
      const result = resolveFieldValue(field, context);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('VISIT_DAYS: 내원일수 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_DAYS } as any,
      });
      const result = resolveFieldValue(field, context);
      expect(result).toBeTruthy();
    });

    it('VISIT_DATE_RANGE: firstDate|lastDate 형식 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_DATE_RANGE } as any,
      });
      const result = resolveFieldValue(field, context);
      expect(result).toBeTruthy();
      expect(result).toContain('|');
    });

    it('내원이력 없으면 null 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.VISIT_DATES } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: [] });
      expect(result).toBeNull();
    });
  });

  describe('보험 관련 resolver', () => {
    it('CERTIFICATE_NO: 최신 내원의 certificateNo 반환', () => {
      const encounters: Encounter[] = [
        makeEncounter({
          id: 1,
          startDateTime: '2024-01-10T09:00:00',
          registration: { certificateNo: 'CERT-OLD' } as any,
        }),
        makeEncounter({
          id: 2,
          startDateTime: '2024-01-20T14:00:00',
          registration: { certificateNo: 'CERT-NEW' } as any,
        }),
      ];

      const field = makeField({
        options: { resolver: ValueResolver.CERTIFICATE_NO } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: encounters });
      expect(result).toBe('CERT-NEW');
    });

    it('PROVIDER_CODE: 최신 내원의 providerCode 반환', () => {
      const encounters: Encounter[] = [
        makeEncounter({
          id: 1,
          startDateTime: '2024-01-20T14:00:00',
          registration: { providerCode: 'PROV-001' } as any,
        }),
      ];

      const field = makeField({
        options: { resolver: ValueResolver.PROVIDER_CODE } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: encounters });
      expect(result).toBe('PROV-001');
    });

    it('내원이력 없으면 null 반환', () => {
      const field = makeField({
        options: { resolver: ValueResolver.CERTIFICATE_NO } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: [] });
      expect(result).toBeNull();
    });
  });

  describe('DATE_RANGE 필드 (dateRange options)', () => {
    const encounters: Encounter[] = [
      makeEncounter({
        id: 1,
        startDateTime: '2024-01-10T09:00:00',
        encounterDateTime: '2024-01-10',
      }),
      makeEncounter({
        id: 2,
        startDateTime: '2024-01-20T14:00:00',
        encounterDateTime: '2024-01-20',
      }),
    ];

    it('startResolver와 endResolver가 있으면 "start|end" 형식 반환', () => {
      const field = makeField({
        options: {
          dateRange: {
            startResolver: ValueResolver.VISIT_FIRST_DATE,
            endResolver: ValueResolver.VISIT_LAST_DATE,
          },
        } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: encounters });
      expect(result).toBeTruthy();
      expect(result).toContain('|');
    });

    it('startResolver만 있으면 "start|" 형식 반환', () => {
      const field = makeField({
        options: {
          dateRange: {
            startResolver: ValueResolver.VISIT_FIRST_DATE,
          },
        } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: encounters });
      expect(result).toMatch(/\|$/);
    });

    it('둘 다 해결 불가하면 null 반환', () => {
      const field = makeField({
        options: {
          dateRange: {
            startResolver: ValueResolver.VISIT_FIRST_DATE,
            endResolver: ValueResolver.VISIT_LAST_DATE,
          },
        } as any,
      });
      const result = resolveFieldValue(field, { appliedEncounters: [] });
      expect(result).toBeNull();
    });
  });
});
