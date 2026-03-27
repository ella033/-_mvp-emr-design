// Reservation 관련 공통 유틸리티 함수들

import src from "vitest-fail-on-console";

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - 포맷팅할 날짜
 * @returns "YYYY년 MM월 DD일 (요일)" 형식의 문자열
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });

  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

/**
 * 시간을 HH:MM 형식으로 포맷팅
 * @param hour - 시간 (0-23)
 * @param minute - 분 (0-59, 기본값: 0)
 * @returns "09:30" 형식의 문자열
 */
export const formatTime = (hour: number, minute: number = 0): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

/**
 * 주어진 날짜가 속한 주의 7일 날짜들을 반환
 * @param date - 기준 날짜
 * @returns 해당 주의 7일 날짜 배열 (일요일부터 시작)
 */
export const getWeekDates = (date: Date): Date[] => {
  const week = [];
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - date.getDay());

  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    week.push(day);
  }
  return week;
};

/**
 * 두 날짜가 같은 날인지 확인 (시간 무시)
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 같은 날이면 true, 아니면 false
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

/**
 * 두 날짜가 정확히 같은지 확인 (시간 포함)
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 정확히 같으면 true, 아니면 false
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime();
};

/**
 * 주어진 날짜가 범위 내에 있는지 확인
 * @param date - 확인할 날짜
 * @param start - 시작 날짜
 * @param end - 종료 날짜
 * @returns 범위 내에 있으면 true, 아니면 false
 */
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * 주어진 날짜의 주간 범위를 계산
 * @param date - 기준 날짜
 * @returns 주간 시작일과 종료일
 */
export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * 날짜 범위 텍스트 생성
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜
 * @returns "1월 15일 - 1월 21일" 형식의 문자열
 */
export const getDateRangeText = (startDate: Date, endDate: Date): string => {
  return `${startDate.getMonth() + 1}월 ${startDate.getDate()}일 (${startDate.toLocaleDateString('ko-KR', { weekday: 'short' })}) - ${endDate.getMonth() + 1}월 ${endDate.getDate()}일 (${endDate.toLocaleDateString('ko-KR', { weekday: 'short' })})`;
};

/**
 * 월 텍스트 생성
 * @param date - 날짜
 * @returns "2024년 1월" 형식의 문자열
 */
export const getMonthText = (date: Date): string => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
};

/**
 * 시간 간격으로 시간 슬롯 배열 생성
 * @param fromTime - 시작 시간 (0-23)
 * @param toTime - 종료 시간 (0-23)
 * @param timeInterval - 시간 간격 (분 단위, 기본값: 30)
 * @returns 시간 슬롯 배열
 */
export const getTimeSlots = (fromTime: number, toTime: number, timeInterval: number = 30): number[] => {
  return Array.from({ length: toTime - fromTime }, (_, i) => fromTime + i);
};

/**
 * 시간당 슬롯 수 계산
 * @param timeInterval - 시간 간격 (분 단위)
 * @returns 시간당 슬롯 수
 */
export const getSlotsPerHour = (timeInterval: number): number => {
  return 60 / timeInterval;
};

// birthDate를 YYYY-MM-DD 형식으로 변환
export const formatBirthDate = (birthDate: string) => {
  if (!birthDate) return '';

  try {
    // YYYYMMDD 형식 (8자리)
    if (birthDate.length === 8) {
      const year = birthDate.slice(0, 4);
      const month = birthDate.slice(4, 6);
      const day = birthDate.slice(6, 8);
      return `${year}-${month}-${day}`;
    }
    return birthDate;
  } catch (error) {
    console.error('오류:', error);
    return birthDate;
  }
};

export const renderExternalPlatformIcon = (externalPlatform: string) => {
  if (externalPlatform && externalPlatform === "ddocdoc") {
    return "/icon/ic_ddocdoc.svg"
  }
  return null;
};

/**
 * 예약 상태별 Tailwind 배지 색상 클래스를 반환
 * @param status - 예약 상태 문자열 (CONFIRMED, CANCELED, NOSHOW, PENDING, VISITED)
 * @returns CSS 변수 기반 배경/글자 색상 Tailwind 클래스 문자열
 */
export const getAppointmentStatusColor = (status: string): string => {
  switch (status) {
    case "CONFIRMED":
      return "bg-[var(--purple-1)] text-[var(--purple-2)]";
    case "CANCELED":
      return "bg-[var(--gray-4)] text-[var(--gray-400)]";
    case "NOSHOW":
      return "bg-[var(--red-1)] text-[var(--red-2)]";
    case "PENDING":
      return "bg-[var(--yellow-4)] text-[var(--yellow-1)]";
    case "VISITED":
      return "bg-[var(--lime-1)] text-[var(--lime-2)]";
    default:
      return "bg-gray-100 text-gray-800";
  }
};