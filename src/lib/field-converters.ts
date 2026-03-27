import { calculateAge, makeRrnView, formatRrn, getGender, formatPhoneNumber } from './patient-utils';
import { FieldConverter } from '@/types/document';

/**
 * 컨버터 함수 매핑
 * - 각 컨버터 타입에 대응하는 변환 함수 정의
 */
const converterFns: Record<FieldConverter, (value: unknown) => unknown> = {
  [FieldConverter.BIRTH_DATE_TO_AGE]: (value) => {
    if (typeof value === 'string' && value) {
      return calculateAge(value);
    }
    return value;
  },

  [FieldConverter.RRN_TO_FORMATTED]: (value) => {
    if (typeof value === 'string' && value) {
      return formatRrn(value);
    }
    return value;
  },

  [FieldConverter.RRN_TO_MASKED]: (value) => {
    if (typeof value === 'string' && value) {
      // FIXME: rrnView 값 다른 곳에서 어떻게 처리하는지 보고 맞추기
      // 하이픈 제거 후 마스킹 처리
      const rrnWithoutHyphen = value.replace(/-/g, '');
      return makeRrnView(rrnWithoutHyphen);
    }
    return value;
  },

  [FieldConverter.GENDER_TO_TEXT]: (value) => {
    if (typeof value === 'number') {
      return getGender(value, 'ko');
    }
    return value;
  },

  [FieldConverter.PHONE_TO_FORMATTED]: (value) => {
    if (typeof value === 'string' && value) {
      return formatPhoneNumber(value);
    }
    return value;
  },
};

/**
 * 필드 값에 컨버터 적용
 * @param value 원본 값
 * @param converter 적용할 컨버터 타입
 * @returns 변환된 값 (컨버터가 없거나 알 수 없는 경우 원본 반환)
 */
export function applyConverter(
  value: unknown,
  converter: FieldConverter | undefined
): unknown {
  if (!converter) return value;

  const converterFn = converterFns[converter];
  if (!converterFn) {
    console.warn(`Unknown field converter: ${converter}`);
    return value;
  }

  return converterFn(value);
}

