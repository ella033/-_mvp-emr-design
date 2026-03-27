import moment from 'moment';
import type { Encounter } from '@/types/chart/encounter-types';

/**
 * 내원이력 날짜들을 특정 형식으로 포맷팅
 * 예: <2025년>2월28일, 3월6일, 7일, 4월3일, 5일, 28일, 5월4일, 6월1일, 8월23일
 */
export function formatVisitDates(encounters: Encounter[]): string {
  if (!encounters || encounters.length === 0) return '';

  // encounterDateTime에서 날짜 추출 및 중복 제거
  const dateSet = new Set<string>();
  const dates = encounters
    .map((encounter) => {
      const dateStr = encounter.encounterDateTime;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      // 날짜를 정규화하여 중복 체크 (년-월-일만 사용)
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      if (dateSet.has(dateKey)) return null; // 중복 제거
      dateSet.add(dateKey);
      return date;
    })
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return '';

  // 연도별, 월별로 그룹화
  const grouped: Record<number, Record<number, number[]>> = {};

  dates.forEach((date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(day);
  });

  // 포맷팅
  const parts: string[] = [];
  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  years.forEach((year) => {
    const yearParts: string[] = [];
    const yearData = grouped[year];
    if (!yearData) return;

    const months = Object.keys(yearData)
      .map(Number)
      .sort((a, b) => a - b);

    months.forEach((month) => {
      const days = yearData[month];
      if (!days) return;
      const sortedDays = days.sort((a, b) => a - b);
      const dayParts: string[] = [];

      sortedDays.forEach((day, index) => {
        if (index === 0) {
          // 첫 번째 날짜는 "월일" 형식
          dayParts.push(`${month}월${day}일`);
        } else {
          // 같은 달의 다음 날짜는 "일"만
          dayParts.push(`${day}일`);
        }
      });

      yearParts.push(dayParts.join(', '));
    });

    parts.push(`<${year}년>${yearParts.join(', ')}`);
  });

  return parts.join('\n');
}

/**
 * 내원이력에서 첫번째 일자(시작일) 반환
 */
export function getFirstVisitDate(encounters: Encounter[]): string | null {
  if (!encounters || encounters.length === 0) return null;

  const dates = encounters
    .map((encounter) => {
      const dateStr = encounter.encounterDateTime;
      if (!dateStr) return null;
      return new Date(dateStr);
    })
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  const firstDate = dates[0];
  if (!firstDate) return null;

  const year = firstDate.getFullYear();
  const month = String(firstDate.getMonth() + 1).padStart(2, '0');
  const day = String(firstDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 내원이력에서 마지막 일자(종료일) 반환
 */
export function getLastVisitDate(encounters: Encounter[]): string | null {
  if (!encounters || encounters.length === 0) return null;

  const dates = encounters
    .map((encounter) => {
      const dateStr = encounter.encounterDateTime;
      if (!dateStr) return null;
      return new Date(dateStr);
    })
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  const lastDate = dates[dates.length - 1];
  if (!lastDate) return null;

  const year = lastDate.getFullYear();
  const month = String(lastDate.getMonth() + 1).padStart(2, '0');
  const day = String(lastDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 내원시작일부터 내원종료일까지 며칠간인지 계산
 * 예: 7일
 */
export function getVisitDays(encounters: Encounter[]): string | null {
  if (!encounters || encounters.length === 0) return null;

  // encounterDateTime에서 날짜 추출 및 중복 제거
  const dateSet = new Set<string>();
  const dates = encounters
    .map((encounter) => {
      const dateStr = encounter.encounterDateTime;
      if (!dateStr) return null;
      const date = new Date(dateStr);
      // 날짜를 정규화하여 중복 체크 (년-월-일만 사용)
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      if (dateSet.has(dateKey)) return null; // 중복 제거
      dateSet.add(dateKey);
      return date;
    })
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  if (!firstDate || !lastDate) return null;

  // moment를 사용하여 일수 계산 (양 끝 포함)
  const firstMoment = moment(firstDate).startOf('day');
  const lastMoment = moment(lastDate).startOf('day');
  const daysDiff = lastMoment.diff(firstMoment, 'days') + 1; // +1은 양 끝 포함

  return `${daysDiff}일`;
}
