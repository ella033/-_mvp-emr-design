"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DailyView } from "./contents-view/daily-view";
import { WeeklyView } from "./contents-view/weekly-view";
import { MonthlyView } from "./contents-view/monthly-view";
import { ListView } from "./contents-view/list-view";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Grid3X3,
  Calendar,
} from "lucide-react";
import {
  formatDate,
  getWeekDates,
  getDateRangeText,
  getMonthText,
} from "@/lib/reservation-utils";
import { AppointmentsService } from "@/services/appointments-service";
import { useHospitalStore } from "@/store/hospital-store";
import { useUserStore } from "@/store/user-store";
import {
  safeLocalStorage,
} from "@/components/yjg/common/util/ui-util";
import { useHospitalSchedule } from "@/hooks/api/use-calendar";
import { useQueryClient } from "@tanstack/react-query";
import { getMonthUTCRangeWithPadding } from "@/lib/date-utils";

interface ContentsPanelProps {
  selectedDate: Date;
  filters: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  };
  isLoading?: boolean;
  onDateChange: (date: Date) => void;
  onDateTimeSelect?: (
    date: Date,
    time?: { hour: number; minute: number }
  ) => void;
  onTimeSlotClick?: (
    date: Date,
    time: { start: string; end: string },
    appointmentRoom?: any
  ) => void;
  onWeekRangeChange?: (range: { start: Date; end: Date }) => void;
  onMonthRangeChange?: (range: { start: Date; end: Date }) => void;
  onViewTypeChange?: (viewType: "day" | "week" | "month" | "list") => void;
  onAppointmentClick?: (appointment: any) => void;
  onResetReservationInfo?: (selectedDateForReservation?: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
}

type ViewType = "day" | "week" | "month" | "list";

const VIEW_TYPE_STORAGE_KEY = "reservation_view_type";

export const ContentsPanel: React.FC<ContentsPanelProps> = ({
  selectedDate,
  filters,
  onDateChange,
  onDateTimeSelect,
  onTimeSlotClick,
  onWeekRangeChange,
  onMonthRangeChange,
  onViewTypeChange,
  onAppointmentClick,
  onResetReservationInfo,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const { hospital } = useHospitalStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const hospitalId = hospital?.id ?? (user as any)?.hospitalId;
  const calendarYear = String(currentDate.getFullYear());
  const calendarMonth = String(currentDate.getMonth() + 1);
  const hospitalScheduleQuery = useHospitalSchedule(calendarYear, calendarMonth);
  const hospitalSchedules = hospitalScheduleQuery.data ?? null;

  // localStorage에서 저장된 viewType 불러오기
  const [viewType, setViewType] = useState<ViewType>(() => {
    try {
      const savedViewType = safeLocalStorage.getItem(VIEW_TYPE_STORAGE_KEY);
      if (
        savedViewType &&
        ["day", "week", "month", "list"].includes(savedViewType)
      ) {
        return savedViewType as ViewType;
      }
    } catch (error) {
      console.error("Failed to load viewType from localStorage:", error);
    }
    return "day"; // 기본값
  });

  const [appointmentEvents, setAppointmentEvents] = useState<any[]>([]);
  const [eventsCache, setEventsCache] = useState<{ [key: string]: any[] }>({});
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string>("");

  // appointmentEvents 메모이제이션 및 데이터 변환
  const memoizedEvents = useMemo(() => {
    if (!appointmentEvents || !Array.isArray(appointmentEvents)) {
      return [];
    }

    const transformedEvents = appointmentEvents
      .map((event) => {
        if (event && typeof event === "object") {
          const startDate = event.appointmentStartTime
            ? new Date(event.appointmentStartTime)
            : new Date();

          let endDate = event.appointmentEndTime
            ? new Date(event.appointmentEndTime)
            : new Date(startDate.getTime() + 15 * 60000);

          const transformedEvent = {
            id: event.id?.toString() || Math.random().toString(),
            title: event.patientName || event.title || "-",
            start: startDate,
            end: endDate,
            color:
              event.appointmentType?.colorCode || event.colorCode || "#3b82f6",
            patientId: event.patientId,
            originalData: event,
          };

          return transformedEvent;
        }
        return null;
      })
      .filter(Boolean) as any[]; // null 값 제거

    return transformedEvents;
  }, [appointmentEvents]);

  // 필터링된 이벤트 계산
  const filteredEvents = useMemo(() => {
    if (!memoizedEvents || memoizedEvents.length === 0) {
      return [];
    }

    const filtered = memoizedEvents.filter((event) => {
      const originalData = event.originalData;

      // 예약실 필터
      if (filters.rooms.length > 0) {
        const eventRoomId = originalData?.appointmentRoomId?.toString();
        const roomMatches = filters.rooms.includes(eventRoomId);

        if (!roomMatches) {
          return false;
        }
      }

      // 진료의 필터
      if (filters.doctors.length > 0) {
        const eventDoctorId = originalData?.doctorId?.toString();
        const doctorMatches = filters.doctors.includes(eventDoctorId) || eventDoctorId === undefined;

        if (!doctorMatches) {
          return false;
        }
      }

      // 예약상태 필터
      if (filters.statuses.length > 0) {
        const eventStatus = originalData?.status;
        const hasStatus = eventStatus !== undefined && eventStatus !== null;
        const statusMatches =
          hasStatus && filters.statuses.includes(Number(eventStatus));
        if (!statusMatches) {
          return false;
        }
      }

      return true;
    });

    // createdTime 기준으로 정렬 (오름차순)
    const sorted = filtered.sort((a, b) => {
      const aCreatedTime = a.originalData?.createDateTime;
      const bCreatedTime = b.originalData?.createDateTime;

      // createdTime이 없는 경우 처리
      if (!aCreatedTime && !bCreatedTime) return 0;
      if (!aCreatedTime) return 1;
      if (!bCreatedTime) return -1;

      return (
        new Date(aCreatedTime).getTime() - new Date(bCreatedTime).getTime()
      );
    });

    return sorted;
  }, [memoizedEvents, filters]);

  // 예약 데이터를 가져오는 함수
  const fetchAppointmentEvents = useCallback(
    async (date: Date) => {
      const currentMonthKey = `${date.getFullYear()}-${date.getMonth()}`;
      // 같은 월이면 조회하지 않음 (단, 초기 로드 시에는 조회)
      if (currentMonthKey === lastFetchedMonth && lastFetchedMonth !== "") {
        return;
      }

      try {
        if (!hospitalId) {
          console.warn(
            "Hospital ID is not available, skipping appointment fetch"
          );
          return;
        }

        const { beginUTC: startDate, endUTC: endDate } =
          getMonthUTCRangeWithPadding(date, 7);
        const cacheKey = currentMonthKey;

        // 캐시에 데이터가 있으면 먼저 표시
        const cachedEvents = eventsCache[cacheKey];
        if (cachedEvents) {
          setAppointmentEvents(cachedEvents);
          setLastFetchedMonth(currentMonthKey);
          return;
        }

        // 예약 이벤트 조회
        const events = await AppointmentsService.getAppointmentsByHospital(
          hospitalId,
          startDate!,
          endDate!
        );

        // 캐시 업데이트
        setEventsCache((prev) => ({
          ...prev,
          [cacheKey]: events,
        }));

        setAppointmentEvents(events);
        setLastFetchedMonth(currentMonthKey);
      } catch (error) {
        console.error("Error fetching appointment events:", error);
      }
    },
    [lastFetchedMonth, hospitalId, eventsCache]
  );

  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  // viewType이 변경될 때 상위로 전달
  useEffect(() => {
    if (onViewTypeChange) {
      onViewTypeChange(viewType);
    }
  }, [viewType, onViewTypeChange]);

  useEffect(() => {
    if (!hospitalId) return;
    fetchAppointmentEvents(selectedDate);
  }, [selectedDate, hospitalId, fetchAppointmentEvents]);

  // 예약 생성 이벤트 감지하여 캐시 초기화
  useEffect(() => {
    const handleAppointmentCreated = async () => {
      setEventsCache({});
      setLastFetchedMonth(""); // 강제로 다시 조회하도록 설정

      // 현재 날짜 기준으로 강제 재조회
      if (currentDate) {
        try {
          if (!hospitalId) {
            console.warn(
              "Hospital ID is not available, skipping appointment fetch"
            );
            return;
          }

          const { beginUTC: startDate, endUTC: endDate } =
            getMonthUTCRangeWithPadding(currentDate, 7);
          const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

          // 예약 이벤트 조회
          const events = await AppointmentsService.getAppointmentsByHospital(
            hospitalId,
            startDate!,
            endDate!
          );

          // 캐시 업데이트
          setEventsCache((prev) => ({
            ...prev,
            [currentMonthKey]: events,
          }));

          setAppointmentEvents(events);
          setLastFetchedMonth(currentMonthKey);
        } catch (error) {
          console.error("강제 새로고침 실패:", error);
        }
      }
    };

    window.addEventListener("appointmentCreated", handleAppointmentCreated);
    return () => {
      window.removeEventListener(
        "appointmentCreated",
        handleAppointmentCreated
      );
    };
  }, [currentDate, hospitalId]);

  // 예약 마감 생성/삭제 이벤트 감지하여 캐시 초기화
  useEffect(() => {
    const handleSlotClosureCreated = async () => {
      // 예약 마감은 스케줄(rooms/slotClosures)에 반영되므로 스케줄만 무효화
      await queryClient.invalidateQueries({
        queryKey: ["calendar", "hospital-schedule"],
      });
    };

    const handleSlotClosureDeleted = async () => {
      await queryClient.invalidateQueries({
        queryKey: ["calendar", "hospital-schedule"],
      });
    };

    // 예약 설정 닫힘 이벤트 감지하여 캐시 초기화
    const handleReservationSettingsClosed = async () => {
      // 예약 설정(진료시간/예약실)이 변경되면 스케줄에 반영되므로 무효화
      await queryClient.invalidateQueries({
        queryKey: ["calendar", "hospital-schedule"],
      });
    };

    window.addEventListener("slotClosureCreated", handleSlotClosureCreated);
    window.addEventListener("slotClosureDeleted", handleSlotClosureDeleted);
    window.addEventListener(
      "reservationSettingsClosed",
      handleReservationSettingsClosed
    );

    return () => {
      window.removeEventListener(
        "slotClosureCreated",
        handleSlotClosureCreated
      );
      window.removeEventListener(
        "slotClosureDeleted",
        handleSlotClosureDeleted
      );
      window.removeEventListener(
        "reservationSettingsClosed",
        handleReservationSettingsClosed
      );
    };
  }, [queryClient]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (viewType) {
      case "day":
      case "list": // list 뷰도 day 뷰와 동일하게 하루씩 이동
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 1 : -1)
        );
        break;
      case "week":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 7 : -7)
        );
        break;
      case "month":
        // Date.setMonth는 "일자" 오버플로우로 인해 1월 29일 -> 3월 1일 같은 점프가 발생할 수 있음
        // 월 이동은 항상 1일로 고정해서 안전하게 처리
        newDate.setDate(1);
        newDate.setMonth(
          newDate.getMonth() + (direction === "next" ? 1 : -1)
        );
        break;
    }

    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  const getCurrentDateRangeText = () => {
    switch (viewType) {
      case "day":
        return formatDate(currentDate);
      case "week":
        const weekDates = getWeekDates(currentDate);
        if (
          weekDates &&
          weekDates.length >= 7 &&
          weekDates[0] &&
          weekDates[6]
        ) {
          return getDateRangeText(weekDates[0], weekDates[6]);
        }
        return formatDate(currentDate);
      case "month":
        return getMonthText(currentDate);
      case "list":
        return formatDate(currentDate);
      default:
        return "";
    }
  };

  const viewTypeButtons = [
    { type: "day" as ViewType, label: "일", icon: Calendar },
    { type: "week" as ViewType, label: "주", icon: Grid3X3 },
    { type: "month" as ViewType, label: "월", icon: Calendar },
    { type: "list" as ViewType, label: "목록", icon: List },
  ];

  // 예약 내역 클릭 핸들러
  const handleEventClick = (event: CalendarEvent) => {
    // 예약 내역 클릭 시 info-panel 활성화
    if (onAppointmentClick) {
      console.log("[ContentsPanel] handleEventClick:", event);
      onAppointmentClick(event);
    }
  };

  const handleDateDoubleClick = useCallback(
    (date: Date) => {
      // daily view로 전환
      onDateChange(date);
      // viewType을 'day'로 변경
      setViewType("day");
      if (onViewTypeChange) {
        onViewTypeChange("day");
      }
    },
    [onDateChange, onViewTypeChange]
  );

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg-main)] p-2 overflow-auto" data-testid="reservation-contents-panel">
      {/* 헤더 */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* 날짜 네비게이션 */}
          <div className="flex items-center space-x-2">
            <h1
              className="text-lg font-semibold text-[var(--gray-200)] text-center truncate"
              style={{
                width:
                  viewType === "week"
                    ? 200
                    : viewType === "month"
                      ? 120
                      : 160, // day/list
              }}
            >
              {getCurrentDateRangeText()}
            </h1>
            <button
              onClick={() => navigateDate("prev")}
              data-testid="reservation-nav-prev-button"
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded border border-[var(--border-1)]"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => navigateDate("next")}
              data-testid="reservation-nav-next-button"
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded border border-[var(--border-1)]"
            >
              <ChevronRight size={12} />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                onDateChange(today);
              }}
              data-testid="reservation-nav-today-button"
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              오늘
            </button>
          </div>

          {/* 우측 정렬 영역 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-gray-300 rounded overflow-hidden">
              {viewTypeButtons.map(({ type, label }, index) => (
                <button
                  key={type}
                  data-testid={`reservation-view-${type}-button`}
                  onClick={() => {
                    setViewType(type);

                    // localStorage에 viewType 저장
                    try {
                      safeLocalStorage.setItem(VIEW_TYPE_STORAGE_KEY, type);
                    } catch (error) {
                      console.error(
                        "Failed to save viewType to localStorage:",
                        error
                      );
                    }

                    // 상위 컴포넌트에 viewType 변경 알림
                    if (onViewTypeChange) {
                      onViewTypeChange(type);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm transition-colors ${viewType === type
                    ? "bg-[var(--bg-main)] text-[var(--gray-100)]"
                    : "bg-[var(--bg-2)] text-[var(--gray-100)] hover:bg-gray-200"
                    } ${index > 0 ? "border-l border-gray-300" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 예약 생성 버튼 */}
            <button
              onClick={() => {
                // 예약정보 초기화. daily 뷰일 때만 선택된 일자를 넘겨 예약일자 설정
                onResetReservationInfo?.(viewType === "day" ? currentDate : undefined);
              }}
              data-testid="reservation-new-appointment-button"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-[var(--bg-base)]"
            >
              + 예약 생성
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 콘텐츠 */}
      <div className="flex-1 h-full w-full overflow-auto">
        {!hospitalSchedules && (
          <div className="flex items-center justify-center h-full text-gray-500">
            스케줄 정보를 불러오는 중...
          </div>
        )}

        {hospitalSchedules && viewType === "day" && (
          <DailyView
            currentDate={currentDate}
            hospitalSchedules={hospitalSchedules}
            events={filteredEvents}
            filters={filters}
            onTimeSlotClick={onTimeSlotClick}
            onDateTimeSelect={onDateTimeSelect}
            onDateChange={onDateChange}
            onEventClick={handleEventClick}
          />
        )}
        {hospitalSchedules && viewType === "week" && (
          <WeeklyView
            currentDate={currentDate}
            hospitalSchedules={hospitalSchedules}
            events={filteredEvents}
            onTimeSlotClick={onTimeSlotClick}
            onDateTimeSelect={onDateTimeSelect}
            onWeekRangeChange={onWeekRangeChange}
            onDateChange={onDateChange}
            onDateDoubleClick={handleDateDoubleClick}
            onEventClick={handleEventClick}
          />
        )}
        {hospitalSchedules && viewType === "month" && (
          <MonthlyView
            currentDate={currentDate}
            hospitalSchedules={hospitalSchedules}
            events={filteredEvents}
            onTimeSlotClick={onTimeSlotClick}
            onDateTimeSelect={onDateTimeSelect}
            onMonthRangeChange={onMonthRangeChange}
            onDateChange={onDateChange}
            onDateDoubleClick={handleDateDoubleClick}
            onEventClick={handleEventClick}
          />
        )}
        {hospitalSchedules && viewType === "list" && (
          <ListView
            currentDate={currentDate}
            hospitalSchedules={hospitalSchedules}
            events={filteredEvents}
            onTimeSlotClick={onTimeSlotClick}
            onDateTimeSelect={onDateTimeSelect}
            onDateChange={onDateChange}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  );
};
