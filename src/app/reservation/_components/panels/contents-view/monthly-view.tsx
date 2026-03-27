import React, { useState, useEffect } from "react";
import { isSameDay } from "@/lib/reservation-utils";
import { AppointmentCard } from "./appointment-card";
import { AppointmentHoverCard } from "./appointment-hover-card";
import { useHoverCard } from "@/hooks/appointment-contents-panel/use-hover-card";
import MyPopup from "@/components/yjg/my-pop-up";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";
import type {
  HospitalSchedule,
  AppointmentRoom,
} from "@/types/calendar-types";
import { findHospitalHolidayInfoFromDate } from "@/lib/holiday-utils";
// 타입 정의
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  appointmentRoomId: number;
  status: number;
  isSimplePatient: boolean;
  patientId?: number;
  originalData?: any;
}

interface CalendarProps {
  operatingHours?: AppointmentRoomOperatingHours[] | null;
  events: CalendarEvent[];
  hospitalSchedules: HospitalSchedule;
  appointmentRoom?: AppointmentRoom;
  onTimeSlotClick?: (date: Date, time: { start: string; end: string }) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  onDateTimeSelect?: (
    date: Date,
    time?: { hour: number; minute: number }
  ) => void;
  onMonthRangeChange?: (range: { start: Date; end: Date }) => void;
  onDateChange?: (date: Date) => void;
}

// 월간 뷰 컴포넌트
export const MonthlyView: React.FC<CalendarProps & { currentDate: Date }> = ({
  currentDate,
  events,
  hospitalSchedules,
  onEventClick,
  onDateDoubleClick,
  onDateTimeSelect,
  onMonthRangeChange,
  onDateChange,
}) => {
  const [maxVisibleEvents, setMaxVisibleEvents] = useState<number>(3); // 기본값
  const hoverCard = useHoverCard();

  // 더보기 모달 관련 상태
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>(
    []
  );
  const [modalDate, setModalDate] = useState<Date | null>(null);

  // 셀 높이에 따른 최대 표시 가능한 이벤트 수 계산
  const calculateMaxVisibleEvents = (cellHeight: number) => {
    const eventHeight = 24; // MonthlyAppointmentCard의 높이 (한 줄 구조, mb-1 포함)
    const padding = 8; // 상하 패딩
    const moreTextHeight = 20; // "+n" 뱃지 높이
    const dateNumberHeight = 24; // 날짜 번호 높이

    const availableHeight =
      cellHeight - padding - dateNumberHeight - moreTextHeight;
    const maxEvents = Math.floor(availableHeight / eventHeight);

    return Math.max(1, maxEvents - 1); // 최소 1개, 최대값에서 1개 빼기
  };

  // 월 범위 계산 및 전달
  useEffect(() => {
    if (onMonthRangeChange) {
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      onMonthRangeChange({
        start: firstDayOfMonth,
        end: lastDayOfMonth,
      });
    }
  }, [currentDate, onMonthRangeChange]);

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const weeks = [];
  const currentWeekStart = new Date(startDate);

  while (
    currentWeekStart <= lastDayOfMonth ||
    currentWeekStart.getDay() !== 0
  ) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      week.push(day);
    }
    weeks.push(week);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);

    if (weeks.length >= 6) break;
  }

  // hover 이벤트 핸들러
  const handleEventMouseEnter = (event: CalendarEvent, e: React.MouseEvent) => {
    hoverCard.handleMouseEnter(event, e);
  };

  // 더보기 뱃지 클릭 핸들러
  const handleMoreBadgeClick = (
    date: Date,
    dayEvents: CalendarEvent[],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setModalDate(date);
    setSelectedDateEvents(
      dayEvents.sort((a, b) => {
        // startTime으로 먼저 정렬
        const timeA = a.start.getTime();
        const timeB = b.start.getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // startTime이 같으면 patientName으로 정렬
        const nameA =
          a.originalData?.patientName ||
          a.originalData?.patient?.name ||
          a.title ||
          "";
        const nameB =
          b.originalData?.patientName ||
          b.originalData?.patient?.name ||
          b.title ||
          "";
        return nameA.localeCompare(nameB);
      })
    );
    setIsMoreModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseMoreModal = () => {
    setIsMoreModalOpen(false);
    setSelectedDateEvents([]);
    setModalDate(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div
            key={day}
            className={`p-2 text-center text-sm font-medium ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-700"}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 - 남은 공간을 모두 차지하면서 균등하게 분할 */}
      <div className="flex-1 flex flex-col">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b border-gray-200 flex-1"
          >
            {week.map((date, dayIndex) => {
              const dayEvents = events.filter((event) =>
                isSameDay(event.start, date)
              );
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(date, new Date());
              const holiday = findHospitalHolidayInfoFromDate(hospitalSchedules.hospitalHolidays, date);

              return (
                <div
                  key={dayIndex}
                  className={`p-2 border-l border-gray-200 min-h-[100px] cursor-pointer flex flex-col relative ${!isCurrentMonth
                    ? "text-gray-300 bg-gray-50"
                    : holiday
                      ? "bg-[var(--bg-1)]"
                      : "bg-[var(--bg-main)]"
                    } ${holiday ? "hover:bg-[var(--bg-1)]" : "hover:bg-gray-50"}`}
                  onClick={() => {
                    if (onDateTimeSelect) {
                      onDateTimeSelect(date);
                    }
                    if (onDateChange) {
                      onDateChange(date);
                    }
                  }}
                  onDoubleClick={(e) => {
                    // 예약 카드(또는 그 내부)를 더블클릭한 경우에는
                    // "예약 상세 열기" 동작을 우선하고, day 전환은 막는다.
                    const target = e.target as HTMLElement | null;
                    if (target?.closest?.("[data-appointment-id]")) {
                      return;
                    }
                    onDateDoubleClick?.(date);
                  }}
                >
                  <div
                    className={`text-sm mb-1 flex-shrink-0 flex items-center gap-1 ${isToday
                      ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      : dayIndex === 0 && isCurrentMonth
                        ? "text-red-500"
                        : dayIndex === 6 && isCurrentMonth
                          ? "text-blue-500"
                          : ""
                      }`}
                  >
                    {date.getDate()}
                    {holiday && (
                      <span className="text-xs text-red-500 font-medium">
                        {holiday.holidayName}
                      </span>
                    )}
                  </div>

                  {/* 이벤트 표시 - 남은 공간 활용 */}
                  <div
                    className="space-y-1 flex-1 overflow-hidden"
                    ref={(el) => {
                      if (el) {
                        const cellHeight =
                          el.parentElement?.offsetHeight || 100;
                        const calculatedMax =
                          calculateMaxVisibleEvents(cellHeight);
                        if (calculatedMax !== maxVisibleEvents) {
                          setMaxVisibleEvents(calculatedMax);
                        }
                      }
                    }}
                  >
                    {dayEvents
                      .slice(0, maxVisibleEvents)
                      .sort((a, b) => {
                        // startTime으로 먼저 정렬
                        const timeA = a.start.getTime();
                        const timeB = b.start.getTime();
                        if (timeA !== timeB) {
                          return timeA - timeB;
                        }

                        // startTime이 같으면 patientName으로 정렬
                        const nameA =
                          a.originalData?.patientName ||
                          a.originalData?.patient?.name ||
                          a.title ||
                          "";
                        const nameB =
                          b.originalData?.patientName ||
                          b.originalData?.patient?.name ||
                          b.title ||
                          "";
                        return nameA.localeCompare(nameB);
                      })
                      .map((event) => (
                        <AppointmentCard
                          key={event.id}
                          appointment={event}
                          viewType="monthly"
                          onDoubleClick={onEventClick}
                          onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                          onMouseLeave={hoverCard.handleMouseLeave}
                        />
                      ))}
                  </div>

                  {/* +n 뱃지 - 오른쪽 하단 */}
                  {dayEvents.length > maxVisibleEvents && (
                    <div
                      className="absolute bottom-1 right-1 bg-[var(--bg-3)] text-xs px-1.5 py-0.5 rounded-full text-gray-600 font-medium cursor-pointer hover:bg-[var(--bg-4)] transition-colors"
                      onClick={(e) => handleMoreBadgeClick(date, dayEvents, e)}
                    >
                      +{dayEvents.length - maxVisibleEvents}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Hover Card (monthly-view) */}
      {hoverCard.hoverCard?.visible && (
        <AppointmentHoverCard
          appointment={hoverCard.hoverCard.appointment}
          style={{
            left: `${hoverCard.hoverCard.x}px`,
            top: `${hoverCard.hoverCard.y}px`,
          }}
          onMouseEnter={hoverCard.handleHoverCardMouseEnter}
          onMouseLeave={hoverCard.handleHoverCardMouseLeave}
        />
      )}

      {/* 더보기 모달 */}
      <MyPopup
        isOpen={isMoreModalOpen}
        onCloseAction={handleCloseMoreModal}
        title={
          modalDate
            ? `${modalDate.getMonth() + 1}월 ${modalDate.getDate()}일`
            : "예약"
        }
        width="200px"
        height="250px"
        minHeight="50px"
        fitContent={false}
      >
        <div className="flex flex-col gap-1 p-2 overflow-y-auto">
          {selectedDateEvents.map((event) => (
            <AppointmentCard
              key={event.id}
              appointment={event}
              viewType="monthly"
              onDoubleClick={onEventClick}
            />
          ))}
          {selectedDateEvents.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              예약이 없습니다.
            </div>
          )}
        </div>
      </MyPopup>
    </div>
  );
};
