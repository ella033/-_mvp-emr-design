export interface HolidayQueryRangeParams {
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

const padTwo = (value: number): string => value.toString().padStart(2, "0");

const formatIsoDate = (year: number, month: number, day: number): string => {
  const isoYear = year.toString().padStart(4, "0");
  const isoMonth = padTwo(month);
  const isoDay = padTwo(day);
  return `${isoYear}-${isoMonth}-${isoDay}`;
};

export const getHolidayQueryRange = (
  startYear: number,
  endYear: number
): HolidayQueryRangeParams => ({
  startDate: formatIsoDate(startYear, 1, 1),
  endDate: formatIsoDate(endYear, 12, 31),
});

export const getHolidayQueryRangeForYear = (
  year: number
): HolidayQueryRangeParams => getHolidayQueryRange(year, year);

export const getHolidayQueryRangeRelativeToYear = (
  baseYear: number,
  startOffset: number,
  endOffset: number
): HolidayQueryRangeParams =>
  getHolidayQueryRange(baseYear + startOffset, baseYear + endOffset);

// ============================================================================
// 휴무일 판별 유틸 (KST 기준)
// ============================================================================
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import type { HolidayType } from "@/constants/common/common-enum";
import type { DayOfWeek } from "@/constants/common/common-enum";
import { HolidayRecurrenceType, HolidayRecurrenceWeek } from "@/constants/common/common-enum";
import type { HospitalHolidayTypes } from "@/types/calendar-types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKstParts(date: Date): {
  year: number;
  monthIndex: number;
  day: number;
  dayOfWeek: DayOfWeek;
} {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    monthIndex: kst.getUTCMonth(),
    day: kst.getUTCDate(),
    dayOfWeek: kst.getUTCDay() as DayOfWeek,
  };
}

export function toKstYmd(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";

  const { year, monthIndex, day } = getKstParts(d);
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function isKstYmdInRange(targetYmd: string, fromYmd: string, toYmd: string): boolean {
  if (!targetYmd || !fromYmd || !toYmd) return false;
  const from = fromYmd <= toYmd ? fromYmd : toYmd;
  const to = fromYmd <= toYmd ? toYmd : fromYmd;
  return targetYmd >= from && targetYmd <= to;
}

export function isMasterHolidayOnDate(
  holiday: HolidayApplicationTypes,
  targetDate: Date,
  systemYear: number = new Date().getFullYear()
): boolean {
  if (holiday.holidayMasterId == null) return false;
  const instances = (holiday as any)?.holidayMaster?.holidayInstances ?? [];
  if (!Array.isArray(instances) || instances.length === 0) return false;

  const targetYmd = toKstYmd(targetDate);

  return instances.some((instance: any) => {
    const actualDate = instance?.actualDate;
    const actual = typeof actualDate === "string" ? new Date(actualDate) : actualDate;
    if (!(actual instanceof Date) || Number.isNaN(actual.getTime())) return false;

    // holidayInstances가 여러 개인 경우 시스템 날짜의 year와 actualDate의 year가 같은 값만 유효
    if (actual.getFullYear() !== systemYear) return false;

    return toKstYmd(actual) === targetYmd;
  });
}

export function isRegularHolidayOnDate(
  holiday: HolidayApplicationTypes,
  targetDate: Date
): boolean {
  if (holiday.holidayMasterId != null) return false;
  const recurrenceType = holiday.recurrenceType ?? HolidayRecurrenceType.없음;
  if (recurrenceType === HolidayRecurrenceType.없음) return false;

  const dayOfWeek = holiday.recurrenceDayOfWeek as DayOfWeek | undefined;
  const week = holiday.recurrenceWeek as HolidayRecurrenceWeek | undefined;
  if (dayOfWeek === undefined || week === undefined) return false;

  // 요구사항: recurrenceWeek + recurrenceDayOfWeek로 판별 (매월)
  if (recurrenceType !== HolidayRecurrenceType.매월) return false;

  const { year, monthIndex, day, dayOfWeek: targetDow } = getKstParts(targetDate);
  if (targetDow !== dayOfWeek) return false;

  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const firstDow = getKstParts(firstOfMonth).dayOfWeek;
  const firstOccurrence = 1 + ((dayOfWeek - firstDow + 7) % 7);

  const lastOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));
  const lastDay = lastOfMonth.getUTCDate();
  const lastDow = getKstParts(lastOfMonth).dayOfWeek;
  const lastOccurrence = lastDay - ((lastDow - dayOfWeek + 7) % 7);

  if (week === HolidayRecurrenceWeek.마지막주) {
    return day === lastOccurrence;
  }

  const nth = firstOccurrence + (Number(week) - 1) * 7;
  return day === nth;
}

export function isTempHolidayOnDate(
  holiday: HolidayApplicationTypes,
  targetDate: Date
): boolean {
  if (holiday.holidayMasterId != null) return false;
  const recurrenceType = holiday.recurrenceType ?? HolidayRecurrenceType.없음;
  if (recurrenceType !== HolidayRecurrenceType.없음) return false;

  const targetYmd = toKstYmd(targetDate);
  const fromYmd = toKstYmd(holiday.startDate as any);
  const toYmd = toKstYmd(holiday.endDate as any);
  if (!fromYmd || !toYmd) return false;
  return isKstYmdInRange(targetYmd, fromYmd, toYmd);
}

export function findHospitalHolidayInfoFromDate(
  holidays: HospitalHolidayTypes[] | null | undefined,
  targetDate: Date
): HospitalHolidayTypes | null {
  const list = holidays ?? [];
  const targetYmd = toKstYmd(targetDate);
  if (!targetYmd) return null;

  return (
    list.find((h) => {
      const fromYmd = toKstYmd(h.startDate as any);
      const toYmd = toKstYmd(h.endDate as any);
      return isKstYmdInRange(targetYmd, fromYmd, toYmd);
    }) ?? null
  );
}

export function isHospitalHolidayDate(
  holidays: HospitalHolidayTypes[] | null | undefined,
  targetDate: Date
): boolean {
  return !!findHospitalHolidayInfoFromDate(holidays, targetDate);
}

