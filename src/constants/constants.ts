
import { DayOfWeek } from "@/constants/common/common-enum";

export const DAY_OF_WEEK_MAP: { [key in DayOfWeek]: string } = {
  [DayOfWeek.SUNDAY]: "일",
  [DayOfWeek.MONDAY]: "월",
  [DayOfWeek.TUESDAY]: "화",
  [DayOfWeek.WEDNESDAY]: "수",
  [DayOfWeek.THURSDAY]: "목",
  [DayOfWeek.FRIDAY]: "금",
  [DayOfWeek.SATURDAY]: "토",
};

export const WEEK_DAYS = [
  { key: DayOfWeek.MONDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.MONDAY] },
  { key: DayOfWeek.TUESDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.TUESDAY] },
  { key: DayOfWeek.WEDNESDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.WEDNESDAY] },
  { key: DayOfWeek.THURSDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.THURSDAY] },
  { key: DayOfWeek.FRIDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.FRIDAY] },
  { key: DayOfWeek.SATURDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.SATURDAY] },
  { key: DayOfWeek.SUNDAY, label: DAY_OF_WEEK_MAP[DayOfWeek.SUNDAY] },
];

export const PRN_CODE = "JT019";
export const PRN_NAME = "PRN 처방";
export const PRN_CONTENT = "P";

/** 임신 주차/일 입력 범위 (공통) */
export const PREGNANCY_WEEK_MIN = 0;
export const PREGNANCY_WEEK_MAX = 43;
export const PREGNANCY_DAY_MIN = 0;
/** 0주일 때 일(day) 상한 (0~31일) */
export const PREGNANCY_DAY_MAX = 31;
/** 1~43주일 때 일(day) 상한 (0~6일만 허용) */
export const PREGNANCY_DAY_MAX_FOR_WEEKS_1_TO_43 = 6;