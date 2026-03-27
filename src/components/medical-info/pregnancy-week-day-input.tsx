"use client";

import React, { useState } from "react";
import {
  PREGNANCY_DAY_MAX,
  PREGNANCY_DAY_MAX_FOR_WEEKS_1_TO_43,
  PREGNANCY_DAY_MIN,
  PREGNANCY_WEEK_MAX,
  PREGNANCY_WEEK_MIN,
} from "@/constants/constants";

/** 0주: 일(day) 0~31, 1~43주: 일(day) 0~6. 기본값 0주 0일. day 변경 시 week는 그대로 onWeekDayChange(week, newDay)만 호출. */
function getDayMax(week: number) {
  return week === PREGNANCY_WEEK_MIN ? PREGNANCY_DAY_MAX : PREGNANCY_DAY_MAX_FOR_WEEKS_1_TO_43;
}

function clampDay(week: number, v: number) {
  return Math.min(getDayMax(week), Math.max(PREGNANCY_DAY_MIN, v));
}

const inputBaseClassName =
  "w-9 border border-gray-300 rounded text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export interface PregnancyWeekDayInputProps {
  week: number;
  day: number;
  onWeekDayChange: (week: number, day: number) => void;
  /** 주 입력이 MIN/MAX 범위를 벗어난 채로 blur 될 때 호출 (임신부 체크 해제용) */
  onWeekOutOfRange?: () => void;
  disabled?: boolean;
}

export function PregnancyWeekDayInput({
  week,
  day,
  onWeekDayChange,
  onWeekOutOfRange,
  disabled = false,
}: PregnancyWeekDayInputProps) {
  const [weekEditing, setWeekEditing] = useState<string | null>(null);
  const [dayEditing, setDayEditing] = useState<string | null>(null);

  const dayMax = getDayMax(week);
  const weekValue = weekEditing !== null ? weekEditing : String(week);
  const dayValue = dayEditing !== null ? dayEditing : String(day);

  return (
    <span className="flex items-center gap-1 ml-1">
      <input
        type="number"
        min={PREGNANCY_WEEK_MIN}
        max={PREGNANCY_WEEK_MAX}
        value={weekValue}
        onFocus={() => setWeekEditing(String(week))}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            setWeekEditing("");
            return;
          }
          if (!/^\d+$/.test(raw)) return;
          setWeekEditing(raw);
        }}
        onBlur={(e) => {
          const v = parseInt(e.target.value, 10);
          setWeekEditing(null);
          if (Number.isNaN(v) || e.target.value.trim() === "") {
            onWeekDayChange(PREGNANCY_WEEK_MIN, clampDay(PREGNANCY_WEEK_MIN, day));
            return;
          }
          if (v < PREGNANCY_WEEK_MIN || v > PREGNANCY_WEEK_MAX) {
            // 44 이상: 체크박스 해제 + 주·일 0으로 처리
            onWeekDayChange(PREGNANCY_WEEK_MIN, PREGNANCY_DAY_MIN);
            onWeekOutOfRange?.();
            return;
          }
          const clampedWeek = Math.min(
            PREGNANCY_WEEK_MAX,
            Math.max(PREGNANCY_WEEK_MIN, v)
          );
          onWeekDayChange(clampedWeek, clampDay(clampedWeek, day));
        }}
        disabled={disabled}
        className={`${inputBaseClassName} ${disabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
      />
      <span className="text-sm text-gray-600">주</span>
      <input
        type="number"
        min={PREGNANCY_DAY_MIN}
        max={dayMax}
        value={dayValue}
        onFocus={() => setDayEditing(String(clampDay(week, day)))}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            setDayEditing("");
            return;
          }
          if (!/^\d+$/.test(raw)) return;
          const v = parseInt(raw, 10);
          if (v > dayMax) {
            setDayEditing(String(dayMax));
            return;
          }
          if (v < PREGNANCY_DAY_MIN) {
            setDayEditing(String(PREGNANCY_DAY_MIN));
            return;
          }
          setDayEditing(raw);
        }}
        onBlur={(e) => {
          const v = parseInt(e.target.value, 10);
          setDayEditing(null);
          const effectiveDay = Number.isNaN(v) || e.target.value.trim() === "" ? PREGNANCY_DAY_MIN : v;
          const clampedDay = clampDay(week, effectiveDay);
          onWeekDayChange(week, clampedDay);
        }}
        disabled={disabled}
        className={`${inputBaseClassName} ${disabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
      />
      <span className="text-sm text-gray-600">일</span>
    </span>
  );
}
