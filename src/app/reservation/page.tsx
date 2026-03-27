"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import OptionsPanel from "./_components/panels/options-panel";
import { ContentsPanel } from "./_components/panels/contents-panel";
import InfoPanel from "./_components/panels/info-panel";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";

export default function ReservationPage() {
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    rooms: [] as string[],
    doctors: [] as string[],
    statuses: [] as number[],
  });
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date;
    time?: { hour: number; minute: number };
  } | undefined>(undefined);
  const [weekRange, setWeekRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [monthRange, setMonthRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'list'>('day');
  const [selectedTimeSlotData, setSelectedTimeSlotData] = useState<{ start: string, end: string, appointmentRoom?: any } | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<boolean>(false);
  const [initialPatientId, setInitialPatientId] = useState<
    string | undefined
  >(undefined);

  // 운영 시간 설정 상태
  const [operatingHours, _setOperatingHours] = useState<AppointmentRoomOperatingHours[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(undefined);
  const [resetReservationInfoTrigger, setResetReservationInfoTrigger] = useState<number>(0);
  const hasReadStorageRef = useRef(false);

  const handleToggleCollapse = () => {
    setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleFilterChange = useCallback((newFilters: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  }) => {
    setFilters(newFilters);
  }, []);

  const handleDateTimeSelect = useCallback((date: Date, time?: { hour: number; minute: number }) => {
    setSelectedDateTime({ date, time });
  }, []);

  const handleWeekRangeChange = useCallback((range: { start: Date; end: Date }) => {
    setWeekRange(range);
  }, []);

  const handleMonthRangeChange = useCallback((range: { start: Date; end: Date }) => {
    setMonthRange(range);
  }, []);

  const handleViewTypeChange = useCallback((type: 'day' | 'week' | 'month' | 'list') => {
    setViewType(type);
  }, []);

  const handleTimeSlotClick = useCallback((date: Date, time: { start: string, end: string }, appointmentRoom: any) => {
    setSelectedTimeSlotData({
      ...time,
      appointmentRoom
    });
    setSelectedDateTime({ ...selectedDateTime, date });
    setSelectedTimeSlot(true);
  }, []);

  const handleAppointmentClick = useCallback((appointment: any) => {
    // 동일한 예약을 다시 클릭할 때도 useEffect가 실행되도록 먼저 undefined로 설정
    setSelectedAppointmentId(undefined);
    // 다음 tick에서 실제 ID 설정
    setTimeout(() => {
      console.log("[ReservationPage] handleAppointmentClick:", appointment);
      setSelectedAppointmentId(appointment.id);
    }, 0);
  }, []);

  const handleResetReservationInfo = useCallback((selectedDateForReservation?: Date) => {
    setSelectedAppointmentId(undefined);
    setResetReservationInfoTrigger((prev) => prev + 1);
    // daily 뷰인 경우에만 선택된 일자를 예약 폼에 설정
    if (selectedDateForReservation) {
      console.log("[ReservationPage] handleResetReservationInfo:", selectedDateForReservation);
      setSelectedDate(selectedDateForReservation);
      setSelectedDateTime({ date: selectedDateForReservation });
    }
  }, []);

  const handleInfoPanelCancel = useCallback(() => {
    // 취소 시 상위 컴포넌트의 상태도 초기화
    setSelectedAppointmentId(undefined);
    setInitialPatientId(undefined);
    setSelectedDateTime(undefined);
    setSelectedTimeSlotData(undefined);
    setSelectedTimeSlot(false);
  }, []);

  // localStorage에서 예약 수정 데이터 읽기
  useEffect(() => {
    if (typeof window === "undefined" || hasReadStorageRef.current) return;

    const readStorageData = () => {
      try {
        const storedData = localStorage.getItem("reservation-edit-data");
        if (!storedData) return false;

        const reservationData = JSON.parse(storedData);

        // 최근 5초 이내 데이터만 처리
        if (reservationData.timestamp && Date.now() - reservationData.timestamp > 5000) {
          localStorage.removeItem("reservation-edit-data");
          return false;
        }

        if (reservationData.selectedDate) {
          const parsedDate = new Date(reservationData.selectedDate);
          if (!Number.isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
          }
        }

        if (reservationData.appointmentId) {
          setSelectedAppointmentId(String(reservationData.appointmentId));
        }

        if (reservationData.patientId) {
          setInitialPatientId(String(reservationData.patientId));
        }

        localStorage.removeItem("reservation-edit-data");
        hasReadStorageRef.current = true;
        return true;
      } catch (error) {
        console.error("[ReservationPage] localStorage 읽기 실패:", error);
        return false;
      }
    };

    // 즉시 시도
    if (readStorageData()) return;

    // 짧은 interval로 재시도 (최대 2초)
    let attemptCount = 0;
    const maxAttempts = 20;
    const intervalId = setInterval(() => {
      attemptCount++;
      if (hasReadStorageRef.current || attemptCount >= maxAttempts) {
        clearInterval(intervalId);
        return;
      }
      if (readStorageData()) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // SearchBar에서 환자 선택 시 info-panel 활성화는 SearchBar 내부에서 처리됨

  return (
    <div className="flex w-full h-full bg-[var(--bg-main)] p-2 gap-2" data-testid="reservation-page">
      {/* 좌측 패널 - 고정 너비 */}
      <div className="flex-shrink-0 h-full">
        <OptionsPanel
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={handleToggleCollapse}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onFilterChange={handleFilterChange}
          weekRange={weekRange}
          monthRange={monthRange}
          viewType={viewType}
        />
      </div>

      {/* 중앙 패널 - 남은 공간 차지, 내부 스크롤 가능 */}
      <div className="flex-1 min-w-0 h-full">
        <ContentsPanel
          selectedDate={selectedDate}
          filters={filters}
          onDateChange={handleDateChange}
          onTimeSlotClick={handleTimeSlotClick}
          onDateTimeSelect={handleDateTimeSelect}
          onWeekRangeChange={handleWeekRangeChange}
          onMonthRangeChange={handleMonthRangeChange}
          onViewTypeChange={handleViewTypeChange}
          onAppointmentClick={handleAppointmentClick}
          onResetReservationInfo={handleResetReservationInfo}
        />
      </div>

      {/* 우측 패널 - 고정 너비 */}
      <div className="flex-shrink-0 h-full">
        <InfoPanel
          selectedDateTime={selectedDateTime}
          selectedTimeSlot={selectedTimeSlot ? selectedTimeSlotData : undefined}
          operatingHours={operatingHours}
          selectedAppointmentId={selectedAppointmentId}
          initialPatientId={initialPatientId}
          resetReservationInfoTrigger={resetReservationInfoTrigger}
          onCancel={handleInfoPanelCancel}
        />
      </div>
    </div>
  );
}
