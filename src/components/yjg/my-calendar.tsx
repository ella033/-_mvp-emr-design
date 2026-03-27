"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "@/lib/utils";
import { MyButton } from "./my-button";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// ============================================================================
// Types
// ============================================================================

export interface MyCalendarRef {
  /** 특정 날짜로 이동 */
  goToDate: (date: Date) => void;
  /** 오늘 날짜로 이동 */
  goToToday: () => void;
  /** 이전 달로 이동 */
  goToPreviousMonth: () => void;
  /** 다음 달로 이동 */
  goToNextMonth: () => void;
  /** 특정 날짜 선택 */
  selectDate: (date: Date) => void;
  /** 현재 선택된 날짜 반환 */
  getSelectedDate: () => Date | null;
  /** 현재 표시 중인 년월 반환 */
  getCurrentViewDate: () => Date;
}

export interface DisabledDateRule {
  /** 비활성화할 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일) */
  disabledDaysOfWeek?: number[];
  /** 비활성화할 특정 날짜들 */
  disabledDates?: Date[];
  /** 커스텀 비활성화 규칙 함수 (true 반환 시 비활성화) */
  customDisabledRule?: (date: Date) => boolean;
  /** 최소 선택 가능 날짜 */
  minDate?: Date;
  /** 최대 선택 가능 날짜 */
  maxDate?: Date;
}

export interface MyCalendarProps {
  /** 초기 선택 날짜 */
  selectedDate?: Date | null;
  /** 날짜 선택 시 콜백 */
  onDateSelectAction?: (date: Date) => void;
  /** 월 변경 시 콜백 */
  onMonthChangeAction?: (date: Date) => void;
  /** 상단에 표시할 커스텀 컨텐츠 (좌우 스크롤 가능) */
  headerContent?: React.ReactNode;
  /** 비활성화 규칙 */
  disabledRule?: DisabledDateRule;
  /** 추가 클래스 */
  className?: string;
  /** 달력 크기 */
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// Constants
// ============================================================================

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

const SIZE_CONFIG = {
  sm: {
    cell: "w-7 h-7 text-[11px]",
    header: "text-[12px]",
    dayOfWeek: "text-[10px]",
  },
  md: {
    cell: "w-8 h-8 text-[12px]",
    header: "text-[13px]",
    dayOfWeek: "text-[11px]",
  },
  lg: {
    cell: "w-10 h-10 text-[14px]",
    header: "text-[14px]",
    dayOfWeek: "text-[12px]",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/** 두 날짜가 같은 날인지 비교 */
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/** 해당 월의 모든 날짜 정보를 생성 */
const generateCalendarDays = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // 이전 달의 날짜들
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // 현재 달의 날짜들
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  // 다음 달의 날짜들 (6주를 채우기 위해)
  const remainingDays = 42 - days.length; // 6주 * 7일 = 42
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return days;
};

// ============================================================================
// Component
// ============================================================================

const MyCalendar = forwardRef<MyCalendarRef, MyCalendarProps>(
  (
    {
      selectedDate: initialSelectedDate = null,
      onDateSelectAction,
      onMonthChangeAction,
      headerContent,
      disabledRule,
      className,
      size = "md",
    },
    ref
  ) => {
    const today = useMemo(() => new Date(), []);
    const [viewDate, setViewDate] = useState<Date>(
      initialSelectedDate || today
    );
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      initialSelectedDate
    );

    const sizeConfig = SIZE_CONFIG[size];

    // 날짜가 비활성화되었는지 확인
    const isDateDisabled = useCallback(
      (date: Date): boolean => {
        if (!disabledRule) return false;

        const {
          disabledDaysOfWeek,
          disabledDates,
          customDisabledRule,
          minDate,
          maxDate,
        } = disabledRule;

        // 요일 체크
        if (disabledDaysOfWeek?.includes(date.getDay())) {
          return true;
        }

        // 특정 날짜 체크
        if (disabledDates?.some((d) => isSameDay(d, date))) {
          return true;
        }

        // 최소 날짜 체크
        if (minDate && date < minDate) {
          return true;
        }

        // 최대 날짜 체크
        if (maxDate && date > maxDate) {
          return true;
        }

        // 커스텀 규칙 체크
        if (customDisabledRule?.(date)) {
          return true;
        }

        return false;
      },
      [disabledRule]
    );

    // 달력 날짜 생성
    const calendarDays = useMemo(() => {
      return generateCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
    }, [viewDate]);

    // 월 변경 핸들러
    const handleMonthChange = useCallback(
      (newDate: Date) => {
        setViewDate(newDate);
        onMonthChangeAction?.(newDate);
      },
      [onMonthChangeAction]
    );

    // 이전 달로 이동
    const goToPreviousMonth = useCallback(() => {
      const newDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() - 1,
        1
      );
      handleMonthChange(newDate);
    }, [viewDate, handleMonthChange]);

    // 다음 달로 이동
    const goToNextMonth = useCallback(() => {
      const newDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        1
      );
      handleMonthChange(newDate);
    }, [viewDate, handleMonthChange]);

    // 날짜 선택
    const selectDate = useCallback(
      (date: Date) => {
        if (!isDateDisabled(date)) {
          setSelectedDate(date);
          onDateSelectAction?.(date);
        }
      },
      [isDateDisabled, onDateSelectAction]
    );

    // 오늘로 이동 + 오늘 날짜 선택
    const goToToday = useCallback(() => {
      handleMonthChange(today);
      selectDate(today);
    }, [today, handleMonthChange, selectDate]);

    // 특정 날짜로 이동
    const goToDate = useCallback(
      (date: Date) => {
        handleMonthChange(date);
      },
      [handleMonthChange]
    );

    // 날짜 클릭 핸들러
    const handleDateClick = useCallback(
      (date: Date, isCurrentMonth: boolean) => {
        if (isDateDisabled(date)) return;

        // 다른 달의 날짜 클릭 시 해당 달로 이동
        if (!isCurrentMonth) {
          handleMonthChange(date);
        }

        selectDate(date);
      },
      [isDateDisabled, handleMonthChange, selectDate]
    );

    // ref를 통한 외부 제어
    useImperativeHandle(
      ref,
      () => ({
        goToDate,
        goToToday,
        goToPreviousMonth,
        goToNextMonth,
        selectDate,
        getSelectedDate: () => selectedDate,
        getCurrentViewDate: () => viewDate,
      }),
      [
        goToDate,
        goToToday,
        goToPreviousMonth,
        goToNextMonth,
        selectDate,
        selectedDate,
        viewDate,
      ]
    );

    return (
      <div
        className={cn(
          "bg-[var(--card)] border border-[var(--border-1)] rounded-md p-3 select-none flex flex-col gap-3",
          className
        )}
      >
        {/* 상단 커스텀 컨텐츠 영역 */}
        {headerContent && headerContent}
        {/* 년월 네비게이션 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className={cn("font-semibold", sizeConfig.header)}>
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </span>
            <MyButton
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="w-6 h-6"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </MyButton>
            <MyButton
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="w-6 h-6"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </MyButton>
          </div>
          <MyButton
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-[12px] px-2 h-6"
          >
            오늘
          </MyButton>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1 gap-[2px]">
          {DAYS_OF_WEEK.map((day, index) => (
            <div
              key={day}
              className={cn(
                "flex items-center justify-center font-medium py-1",
                sizeConfig.dayOfWeek,
                sizeConfig.cell.split(" ").find((c) => c.startsWith("w-")),
                index === 0 && "text-red-500",
                index === 6 && "text-blue-500"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-[2px]">
          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isDisabled = isDateDisabled(date);
            const dayOfWeek = date.getDay();

            return (
              <button
                key={index}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateClick(date, isCurrentMonth)}
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  sizeConfig.cell,
                  // 기본 스타일
                  !isCurrentMonth && "text-[var(--gray-500)]",
                  isCurrentMonth && "text-[var(--fg-main)]",
                  // 요일별 색상 (현재 달만)
                  isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                  isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                  // 오늘 날짜 (점선 테두리)
                  isToday &&
                  !isSelected &&
                  "border-2 border-dashed border-[var(--main-color)]",
                  // 선택된 날짜
                  isSelected &&
                  "bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90",
                  // 비활성화
                  isDisabled && "opacity-30 cursor-not-allowed line-through",
                  // 호버 (선택되지 않은 경우)
                  !isSelected &&
                  !isDisabled &&
                  "hover:bg-[var(--bg-hover)] cursor-pointer"
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

MyCalendar.displayName = "MyCalendar";

export default MyCalendar;
