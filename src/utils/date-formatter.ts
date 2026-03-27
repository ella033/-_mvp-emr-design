import moment from 'moment';

/**
 * 날짜 값을 지정된 포맷으로 포맷팅합니다.
 * @param value - 포맷팅할 날짜 값 (문자열, Date 객체, 또는 moment.Moment)
 * @param format - moment.js 포맷 문자열 (예: 'YYYY-MM-DD', 'YYYY년 MM월 DD일')
 * @param defaultFormat - 포맷이 지정되지 않은 경우 사용할 기본 포맷
 * @returns 포맷팅된 날짜 문자열, 또는 원본 값 (날짜가 아닌 경우)
 */
export function formatDate(
  value: unknown,
  format?: string,
  defaultFormat: string = 'YYYY-MM-DD'
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // 포맷이 지정되지 않으면 기본 포맷 사용
  const dateFormat = format || defaultFormat;

  // moment 객체인 경우
  if (moment.isMoment(value)) {
    return value.format(dateFormat);
  }

  // Date 객체인 경우
  if (value instanceof Date) {
    return moment(value).format(dateFormat);
  }

  // 문자열인 경우
  if (typeof value === 'string') {
    // ISO 형식 또는 날짜 형식 문자열인지 확인
    const parsed = moment(value);
    if (parsed.isValid()) {
      return parsed.format(dateFormat);
    }
    // 유효한 날짜가 아니면 원본 반환
    return value;
  }

  // 숫자 타임스탬프인 경우
  if (typeof value === 'number') {
    return moment(value).format(dateFormat);
  }

  // 날짜로 변환할 수 없는 경우 원본 반환
  return String(value);
}

/**
 * 날짜시간 값을 지정된 포맷으로 포맷팅합니다.
 * @param value - 포맷팅할 날짜시간 값
 * @param format - moment.js 포맷 문자열 (예: 'YYYY-MM-DD HH:mm:ss', 'YYYY년 MM월 DD일 HH시 mm분')
 * @param defaultFormat - 포맷이 지정되지 않은 경우 사용할 기본 포맷
 * @returns 포맷팅된 날짜시간 문자열, 또는 원본 값 (날짜가 아닌 경우)
 */
export function formatDateTime(
  value: unknown,
  format?: string,
  defaultFormat: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  return formatDate(value, format, defaultFormat);
}
