import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FieldConverter } from '@/types/document';
import { applyConverter } from '../field-converters';

// ---------------------------------------------------------------------------
// Mock the patient-utils dependency used by field-converters
// ---------------------------------------------------------------------------
vi.mock('./patient-utils', () => ({
  calculateAge: vi.fn((birthDate: string) => {
    // Deterministic stub: "19920101" → 32 (for test purposes)
    if (birthDate === '19920101') return 32;
    if (birthDate === 'invalid') return undefined;
    return 30;
  }),
  makeRrnView: vi.fn((rrn: string) => {
    if (!rrn || rrn.length < 7) return '';
    return `${rrn.substring(0, 6)}-${rrn.substring(6, 7)}******`;
  }),
  getGender: vi.fn((gender: number, lang: string) => {
    if (lang === 'ko') {
      if (gender === 1) return '남';
      if (gender === 2) return '여';
    }
    return '';
  }),
  formatPhoneNumber: vi.fn((phone: string) => {
    if (!phone) return '';
    const nums = phone.replace(/\D/g, '');
    if (nums.length === 11 && nums.startsWith('010')) {
      return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
    }
    return phone;
  }),
}));

// ---------------------------------------------------------------------------
// Suppress console.warn for unknown converter tests (vitest-fail-on-console)
// ---------------------------------------------------------------------------
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('applyConverter', () => {
  describe('BIRTH_DATE_TO_AGE', () => {
    it('converts a valid birth date string to age', () => {
      const result = applyConverter('19920101', FieldConverter.BIRTH_DATE_TO_AGE);
      expect(result).toBe(32);
    });

    it('returns the original value for non-string input', () => {
      expect(applyConverter(12345, FieldConverter.BIRTH_DATE_TO_AGE)).toBe(12345);
      expect(applyConverter(null, FieldConverter.BIRTH_DATE_TO_AGE)).toBeNull();
    });

    it('returns the original value for empty string', () => {
      expect(applyConverter('', FieldConverter.BIRTH_DATE_TO_AGE)).toBe('');
    });
  });

  describe('RRN_TO_MASKED', () => {
    it('masks a resident registration number (without hyphen)', () => {
      const result = applyConverter('9201011234567', FieldConverter.RRN_TO_MASKED);
      expect(result).toBe('920101-1******');
    });

    it('strips hyphens before masking', () => {
      const result = applyConverter('920101-1234567', FieldConverter.RRN_TO_MASKED);
      // Hyphen removed → "9201011234567" → makeRrnView called
      expect(result).toBe('920101-1******');
    });

    it('returns original value for non-string input', () => {
      expect(applyConverter(123, FieldConverter.RRN_TO_MASKED)).toBe(123);
    });

    it('returns original value for empty string', () => {
      expect(applyConverter('', FieldConverter.RRN_TO_MASKED)).toBe('');
    });
  });

  describe('GENDER_TO_TEXT', () => {
    it('converts gender code 1 to 남', () => {
      expect(applyConverter(1, FieldConverter.GENDER_TO_TEXT)).toBe('남');
    });

    it('converts gender code 2 to 여', () => {
      expect(applyConverter(2, FieldConverter.GENDER_TO_TEXT)).toBe('여');
    });

    it('returns original value for non-number input', () => {
      expect(applyConverter('male', FieldConverter.GENDER_TO_TEXT)).toBe('male');
      expect(applyConverter(null, FieldConverter.GENDER_TO_TEXT)).toBeNull();
    });
  });

  describe('PHONE_TO_FORMATTED', () => {
    it('formats a valid 11-digit phone number', () => {
      const result = applyConverter('01012345678', FieldConverter.PHONE_TO_FORMATTED);
      expect(result).toBe('010-1234-5678');
    });

    it('returns original value for non-string input', () => {
      expect(applyConverter(12345, FieldConverter.PHONE_TO_FORMATTED)).toBe(12345);
    });

    it('returns original value for empty string', () => {
      expect(applyConverter('', FieldConverter.PHONE_TO_FORMATTED)).toBe('');
    });
  });

  describe('no converter / unknown converter', () => {
    it('returns original value when converter is undefined', () => {
      expect(applyConverter('hello', undefined)).toBe('hello');
      expect(applyConverter(42, undefined)).toBe(42);
    });

    it('returns original value and warns for unknown converter', () => {
      const result = applyConverter('test', 'unknownConverter' as FieldConverter);
      expect(result).toBe('test');
      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown field converter: unknownConverter'
      );
    });
  });
});
