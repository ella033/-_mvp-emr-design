import { useCallback } from 'react';

/**
 * 질병등록 관련 폼 유틸리티 훅
 */
export function useDisregFormUtils() {
  /**
   * 날짜 포맷팅 (Date -> YYYY-MM-DD, 로컬 날짜 기준)
   * toISOString() 사용 시 UTC 기준이라 타임존에 따라 하루 밀리므로 로컬 getFullYear/getMonth/getDate 사용
   */
  const formatDate = useCallback((date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * 날짜 파싱 (YYYY-MM-DD 문자열 -> Date, 로컬 날짜로 해석)
   * new Date('YYYY-MM-DD')는 UTC 자정으로 해석되어 타임존에 따라 하루 밀릴 수 있으므로 로컬 파싱 사용
   */
  const parseDate = useCallback((dateString: string): Date | null => {
    if (!dateString) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());
    if (match) {
      const y = match[1];
      const m = match[2];
      const d = match[3];
      if (y === undefined || m === undefined || d === undefined) return null;
      const year = parseInt(y, 10);
      const month = parseInt(m, 10) - 1;
      const day = parseInt(d, 10);
      const date = new Date(year, month, day);
      return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }, []);

  /**
   * 문자열 값 안전하게 가져오기 (객체나 null/undefined인 경우 빈 문자열 반환)
   */
  const getStringValue = useCallback((value: any): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return '';
    return String(value);
  }, []);

  /**
   * 날짜 문자열을 Date로 변환 (YYYYMMDD 형식)
   */
  const parseDateString = useCallback((dateStr: any): Date | null => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length !== 8) return null;
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }, []);

  /**
   * Date를 YYYYMMDD 형식 문자열로 변환
   */
  const formatDateString = useCallback((date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }, []);

  return {
    formatDate,
    parseDate,
    getStringValue,
    parseDateString,
    formatDateString,
  };
}

