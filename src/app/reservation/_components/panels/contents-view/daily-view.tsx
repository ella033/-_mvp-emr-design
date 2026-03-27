import React from 'react';
import { TimeSlotGrid } from './time-slot-grid';
import type { HospitalSchedule } from '@/types/calendar-types';
import { useDailyView } from "@/hooks/appointment/actions/use-daily-view";

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
  events: CalendarEvent[];
  hospitalSchedules: HospitalSchedule | null;
  filters?: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  };
  onTimeSlotClick?: (date: Date, time: { start: string, end: string }, room: any, isContextMenu?: boolean) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onDateTimeSelect?: (date: Date, time?: { hour: number; minute: number }) => void;
  onDateChange?: (date: Date) => void;
}

// 일간 뷰 컴포넌트
export const DailyView: React.FC<CalendarProps & { currentDate: Date }> = ({
  currentDate,
  events,
  hospitalSchedules,
  filters,
  onTimeSlotClick,
  onEventClick,
  onDateTimeSelect,
  onDateChange
}) => {
  // 커스텀 훅 사용
  const {
    filteredRooms,
    unifiedHourHeight,
    earliestStartTime,
    latestEndTime,
    timeLabels,
    timeLabelsHourHeight,
    getSlotHeightForRoom,
    getSlotsPerHour,
    formatTimeLabel,
  } = useDailyView({
    hospitalSchedules,
    currentDate,
    filters,
  });

  if (!filteredRooms || filteredRooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {!hospitalSchedules?.rooms || hospitalSchedules.rooms.length === 0
          ? "예약실 정보가 없습니다."
          : "선택된 예약실이 없습니다."}
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-auto">
      <div className="flex flex-nowrap">
        {/* 시간 레이블 컬럼 */}
        <div className="flex-shrink-0 border-r border-gray-300 bg-gray-50 relative">
          {/* 헤더 공간 */}
          <div className="h-[41px] border-b border-gray-200 px-2"></div>
          {/* 시간 레이블들 */}
          <div className="relative">
            {timeLabels.map((hour, index) => {
              const isLastLabel = index === timeLabels.length - 1;
              const endMinute = parseInt(latestEndTime.split(':')[1] || '0');
              // 정시 종료(endMinute === 0)이고 마지막 라벨인 경우 border 제거
              const shouldRemoveBorder = endMinute === 0 && isLastLabel;

              return (
                <div
                  key={hour}
                  className={`text-sm text-gray-600 px-2 py-1 flex items-start font-medium w-[50px] ${shouldRemoveBorder ? '' : 'border-b border-gray-300'}`}
                  style={{ height: `${timeLabelsHourHeight}px` }}
                >
                  {formatTimeLabel(hour)}
                </div>
              );
            })}
          </div>
        </div>

        {/* 진료실 컬럼들 */}
        {filteredRooms.map((appointmentRoom, index) => {
          // 현재 날짜의 운영시간 확인
          const dayOfWeek = currentDate.getDay();
          const currentOperatingHours = appointmentRoom.weeklySchedule?.current?.days?.find(
            (d) => d.dayOfWeek === dayOfWeek
          );
          const roomTimeSlotDuration =
            currentOperatingHours?.timeSlotDuration || 15;

          // 해당 룸의 슬롯 높이 계산
          const roomSlotHeight = getSlotHeightForRoom(roomTimeSlotDuration);
          const roomSlotsPerHour = getSlotsPerHour(roomTimeSlotDuration);
          const roomHourHeight =
            unifiedHourHeight || roomSlotHeight * roomSlotsPerHour;

          return (
            <div key={appointmentRoom.id} className="border-r border-gray-200 min-w-[250px] flex-grow flex-shrink-0">
              <div className="bg-gray-50 p-2 border-b border-gray-200 flex gap-2 items-center h-[41px]">
                <span className="font-semibold text-gray-800 text-center w-full">{appointmentRoom.name}</span>
              </div>
              {(() => {
                const filteredEvents = events.filter(
                  (event) =>
                    Number(event.originalData?.appointmentRoomId) ===
                    appointmentRoom.id
                );
                return (
                  <TimeSlotGrid
                    hospitalSchedules={hospitalSchedules ?? undefined}
                    appointmentRoom={appointmentRoom}
                    events={filteredEvents}
                    currentDate={currentDate}
                    showTimeLabels={false}
                    showCurrentTime={index === 0} // 첫 번째 예약실에만 현재시간 표시
                    overrideSlotHeight={
                      filteredRooms.length > 1 ? roomSlotHeight : undefined
                    }
                    overrideHourHeight={
                      filteredRooms.length > 1 ? roomHourHeight : undefined
                    }
                    earliestStartTime={earliestStartTime}
                    latestEndTime={latestEndTime}
                    onTimeSlotClick={(date, time, room, isContextMenu = false) => {
                      // context-menu에서 호출된 경우 바로 실행
                      if (isContextMenu) {
                        onTimeSlotClick && onTimeSlotClick(date, time, room);
                        return;
                      }

                      // 더블클릭일 때만 동작
                      // 간단한 더블클릭 탐지 (같은 슬롯을 300ms 내 두 번 클릭)
                      // 슬롯 키는 날짜+시작/종료시간 기준
                      if (!(window as any).__dvLastSlotClick) {
                        (window as any).__dvLastSlotClick = { key: '', time: 0 };
                      }
                      const last = (window as any).__dvLastSlotClick as { key: string; time: number };
                      const key = `${date.toDateString()}_${time.start}_${time.end}_${appointmentRoom.id}`;
                      const now = Date.now();
                      if (last.key === key && now - last.time < 300) {
                        onTimeSlotClick && onTimeSlotClick(date, time, room);
                      }
                      (window as any).__dvLastSlotClick = { key, time: now };
                    }}
                    onEventClick={onEventClick}
                    onDateTimeSelect={onDateTimeSelect}
                    onDateChange={onDateChange}
                  />
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};