import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPreviewDefaultsFromFields } from './preview-form-defaults';
import { FieldType } from '@/types/document';
import { ValueResolver } from '@/lib/field-value-resolvers';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

// Mock date-formatter to avoid locale/timezone issues
vi.mock('@/utils/date-formatter', () => ({
  formatDate: vi.fn((_value: unknown, format?: string) => {
    if (format === 'YYYY-MM-DD' || !format) return '2025-01-15';
    return `formatted:${format}`;
  }),
  formatDateTime: vi.fn((_value: unknown, format?: string) => {
    if (format === 'YYYY-MM-DD HH:mm:ss' || !format) return '2025-01-15 10:30:00';
    return `formatted-dt:${format}`;
  }),
}));

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeField(overrides: Partial<FormFieldDto> = {}): FormFieldDto {
  return {
    id: 1,
    key: 'field_001',
    name: 'Test Field',
    type: FieldType.TEXT,
    pageNumber: 1,
    x: 0,
    y: 0,
    width: 100,
    height: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textAlign: 'left',
    order: 0,
    dataSource: null as FormFieldDto['dataSource'],
    options: null as FormFieldDto['options'],
    defaultValue: null as FormFieldDto['defaultValue'],
    ...overrides,
  };
}

function withOptions(field: FormFieldDto, options: Record<string, unknown>): FormFieldDto {
  return { ...field, options: options as unknown as FormFieldDto['options'] };
}

function withDataSource(field: FormFieldDto, ds: string): FormFieldDto {
  return { ...field, dataSource: ds as unknown as FormFieldDto['dataSource'] };
}

// ---------------------------------------------------------------------------
// basic behavior
// ---------------------------------------------------------------------------
describe('buildPreviewDefaultsFromFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty object for empty fields array', () => {
    expect(buildPreviewDefaultsFromFields([])).toEqual({});
  });

  // -------------------------------------------------------------------------
  // CHECKBOX fields
  // -------------------------------------------------------------------------
  describe('checkbox fields', () => {
    it('sets standalone checkbox to true', () => {
      const field = makeField({ key: 'cb1', type: FieldType.CHECKBOX });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['cb1']).toBe(true);
    });

    it('handles radioGroup checkboxes - selects first checkbox per group', () => {
      const cb1 = withOptions(makeField({ key: 'cb_a', type: FieldType.CHECKBOX, order: 0 }), {
        radioGroup: 'group1',
      });
      const cb2 = withOptions(makeField({ key: 'cb_b', type: FieldType.CHECKBOX, order: 1 }), {
        radioGroup: 'group1',
      });
      const cb3 = withOptions(makeField({ key: 'cb_c', type: FieldType.CHECKBOX, order: 0 }), {
        radioGroup: 'group2',
      });

      const result = buildPreviewDefaultsFromFields([cb1, cb2, cb3]);

      // radioGroup_groupName should be set to first checkbox key
      expect(result['radioGroup_group1']).toBe('cb_a');
      expect(result['radioGroup_group2']).toBe('cb_c');

      // Individual checkbox keys should NOT be set for radio group members
      expect(result['cb_a']).toBeUndefined();
      expect(result['cb_b']).toBeUndefined();
      expect(result['cb_c']).toBeUndefined();
    });

    it('does not set radioGroup key for non-string radioGroup option', () => {
      const cb = withOptions(makeField({ key: 'cb1', type: FieldType.CHECKBOX }), {
        radioGroup: 123, // not a string
      });

      const result = buildPreviewDefaultsFromFields([cb]);
      // No radioGroup key, treated as standalone checkbox
      expect(result['cb1']).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Resolver-based fields
  // -------------------------------------------------------------------------
  describe('resolver-based fields', () => {
    it('returns hardcoded value for VISIT_DATES resolver', () => {
      const field = withOptions(makeField({ key: 'vd', type: FieldType.TEXT }), {
        resolver: ValueResolver.VISIT_DATES,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['vd']).toBe('<2025년>1월1일, 2일, 3일');
    });

    it('returns hardcoded value for VISIT_FIRST_DATE resolver', () => {
      const field = withOptions(makeField({ key: 'vfd', type: FieldType.TEXT }), {
        resolver: ValueResolver.VISIT_FIRST_DATE,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['vfd']).toBe('2023-01-01');
    });

    it('returns hardcoded value for VISIT_LAST_DATE resolver', () => {
      const field = withOptions(makeField({ key: 'vld', type: FieldType.TEXT }), {
        resolver: ValueResolver.VISIT_LAST_DATE,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['vld']).toBe('2023-01-03');
    });

    it('returns hardcoded value for VISIT_DAYS resolver', () => {
      const field = withOptions(makeField({ key: 'days', type: FieldType.TEXT }), {
        resolver: ValueResolver.VISIT_DAYS,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['days']).toBe('3일');
    });

    it('returns hardcoded value for CERTIFICATE_NO resolver', () => {
      const field = withOptions(makeField({ key: 'cn', type: FieldType.TEXT }), {
        resolver: ValueResolver.CERTIFICATE_NO,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['cn']).toBe('30123456789');
    });

    it('returns hardcoded value for PROVIDER_CODE resolver', () => {
      const field = withOptions(makeField({ key: 'pc', type: FieldType.TEXT }), {
        resolver: ValueResolver.PROVIDER_CODE,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['pc']).toBe('12345678');
    });

    it('returns hardcoded value for PROVIDER_NAME resolver', () => {
      const field = withOptions(makeField({ key: 'pn', type: FieldType.TEXT }), {
        resolver: ValueResolver.PROVIDER_NAME,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['pn']).toBe('국민건강보험공단');
    });

    it('returns hardcoded value for INSURED_PERSON resolver', () => {
      const field = withOptions(makeField({ key: 'ip', type: FieldType.TEXT }), {
        resolver: ValueResolver.INSURED_PERSON,
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['ip']).toBe('홍길동');
    });

    it('returns empty string for unknown resolver', () => {
      const field = withOptions(makeField({ key: 'unk', type: FieldType.TEXT }), {
        resolver: 'unknown.resolver',
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['unk']).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // DATE fields
  // -------------------------------------------------------------------------
  describe('DATE fields', () => {
    it('returns formatted date for DATE type', () => {
      const field = makeField({ key: 'date1', type: FieldType.DATE });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['date1']).toBe('2025-01-15');
    });

    it('passes dateFormat option to formatDate', () => {
      const field = withOptions(makeField({ key: 'date2', type: FieldType.DATE }), {
        dateFormat: 'YYYY년 MM월 DD일',
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['date2']).toBe('formatted:YYYY년 MM월 DD일');
    });

    it('returns date range for DATE with dateRange option', () => {
      const field = withOptions(makeField({ key: 'dr', type: FieldType.DATE }), {
        dateRange: { startResolver: 'visit.firstDate' },
      });
      const result = buildPreviewDefaultsFromFields([field]);
      // Should contain pipe separator for start|end format
      expect(typeof result['dr']).toBe('string');
      expect((result['dr'] as string).includes('|')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // DATETIME fields
  // -------------------------------------------------------------------------
  describe('DATETIME fields', () => {
    it('returns formatted datetime for DATETIME type', () => {
      const field = makeField({ key: 'dt1', type: FieldType.DATETIME });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['dt1']).toBe('2025-01-15 10:30:00');
    });

    it('passes dateFormat option to formatDateTime', () => {
      const field = withOptions(makeField({ key: 'dt2', type: FieldType.DATETIME }), {
        dateFormat: 'YYYY-MM-DD HH:mm',
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['dt2']).toBe('formatted-dt:YYYY-MM-DD HH:mm');
    });
  });

  // -------------------------------------------------------------------------
  // STAMP fields
  // -------------------------------------------------------------------------
  describe('STAMP fields', () => {
    it('returns undefined for STAMP type (no preview value)', () => {
      const field = makeField({ key: 'stamp1', type: FieldType.STAMP });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['stamp1']).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // dataSource-based fields (patient, document, hospital, doctor)
  // -------------------------------------------------------------------------
  describe('dataSource-based fields', () => {
    const dataSourceCases: Array<[string, string]> = [
      ['patient.patientNo', '123'],
      ['patient.name', '홍길동'],
      ['patient.gender', '남'],
      ['patient.age', '34'],
      ['patient.birthDate', '1990-01-01'],
      ['patient.address', '서울특별시 강남구 테헤란로 123'],
      ['patient.rrn', '900101-1234567'],
      ['patient.rrnView', '900101-1******'],
      ['patient.phone1', '010-1234-5678'],
      ['document.issuanceNo', '0001'],
      ['document.freeText', '소견서 내용 예시 텍스트입니다.'],
      ['hospital.name', '의사랑의원'],
      ['hospital.nameEn', 'Euirang Clinic'],
      ['hospital.owner', '홍길동'],
      ['hospital.number', '12345678'],
      ['hospital.address', '서울특별시 강남구 테헤란로 456'],
      ['hospital.addressEn', '456 Teheran-ro, Gangnam-gu, Seoul'],
      ['hospital.address1En', '456 Teheran-ro'],
      ['hospital.address2En', 'Gangnam-gu, Seoul'],
      ['hospital.phone', '02-1234-5678'],
      ['hospital.fax', '02-1234-5679'],
      ['hospital.sealUuid', '[직인]'],
      ['hospital.directorSealUuid', '[병원장직인]'],
      ['doctor.name', '김현호'],
      ['doctor.nameEn', 'Hyeonho Kim'],
      ['doctor.licenseNo', '110479'],
      ['doctor.licenseNumber', '110479'],
    ];

    it.each(dataSourceCases)(
      'returns expected preview value for dataSource "%s"',
      (source, expected) => {
        const field = withDataSource(makeField({ key: `ds_${source}`, type: FieldType.TEXT }), source);
        const result = buildPreviewDefaultsFromFields([field]);
        expect(result[`ds_${source}`]).toBe(expected);
      }
    );
  });

  // -------------------------------------------------------------------------
  // NUMBER with scoreGroup
  // -------------------------------------------------------------------------
  describe('NUMBER with scoreGroup', () => {
    it('returns "10" for NUMBER field with scoreGroup option', () => {
      const field = withOptions(makeField({ key: 'score1', type: FieldType.NUMBER }), {
        scoreGroup: 'total',
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['score1']).toBe('10');
    });
  });

  // -------------------------------------------------------------------------
  // Fallback behavior
  // -------------------------------------------------------------------------
  describe('fallback behavior', () => {
    it('uses placeholder from options when no dataSource matches', () => {
      const field = withOptions(makeField({ key: 'fb1', type: FieldType.TEXT }), {
        placeholder: 'Enter value',
      });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['fb1']).toBe('Enter value');
    });

    it('falls back to field name when no placeholder and no dataSource match', () => {
      const field = makeField({ key: 'fb2', name: 'My Field', type: FieldType.TEXT });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['fb2']).toBe('My Field');
    });

    it('falls back to empty string when no placeholder, no name, and no dataSource match', () => {
      const field = makeField({ key: 'fb3', name: '', type: FieldType.TEXT });
      const result = buildPreviewDefaultsFromFields([field]);
      expect(result['fb3']).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Multiple fields combined
  // -------------------------------------------------------------------------
  describe('mixed fields', () => {
    it('handles multiple field types in one call', () => {
      const fields = [
        makeField({ key: 'text1', type: FieldType.TEXT, name: 'Name' }),
        makeField({ key: 'cb1', type: FieldType.CHECKBOX }),
        makeField({ key: 'date1', type: FieldType.DATE }),
        makeField({ key: 'stamp1', type: FieldType.STAMP }),
        withDataSource(makeField({ key: 'pname', type: FieldType.TEXT }), 'patient.name'),
      ];

      const result = buildPreviewDefaultsFromFields(fields);

      expect(result['text1']).toBe('Name');
      expect(result['cb1']).toBe(true);
      expect(result['date1']).toBe('2025-01-15');
      expect(result['stamp1']).toBeUndefined();
      expect(result['pname']).toBe('홍길동');
    });
  });
});
