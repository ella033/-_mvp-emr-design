import React, { useEffect, useMemo } from 'react';
import { getWeekDates, isSameDay } from "@/lib/reservation-utils";
import { TimeSlotGrid } from './time-slot-grid';
import type { HospitalSchedule } from '@/types/calendar-types';

// 타입 정의
interface CalendarEvent {
  id: string;
  title: string;
  memo?: string;
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
  hospitalSchedules: HospitalSchedule;
  onTimeSlotClick?: (date: Date, time: { start: string, end: string }) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onDateTimeSelect?: (date: Date, time?: { hour: number; minute: number }) => void;
  onWeekRangeChange?: (range: { start: Date; end: Date }) => void;
  onDateChange?: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
}

// 주간 뷰 컴포넌트
export const WeeklyView: React.FC<CalendarProps & { currentDate: Date }> = ({
  currentDate,
  events,
  hospitalSchedules,
  onTimeSlotClick,
  onEventClick,
  onDateTimeSelect,
  onWeekRangeChange,
  onDateChange,
  onDateDoubleClick
}) => {
  const weekDates = getWeekDates(currentDate);

  const getSlotsPerHour = (timeInterval: number): number => {
    return 60 / timeInterval;
  };

  // 가장 작은 단위의 timeSlotDuration을 가진 appointmentRoom 찾기
  const { minTimeSlotDuration, minTimeSlotRoom } = useMemo(() => {
    if (!hospitalSchedules?.rooms || hospitalSchedules.rooms.length === 0) {
      return { minTimeSlotDuration: 15, minTimeSlotRoom: null }; // 기본값 15분
    }

    let minDuration = Infinity;
    let minRoom: any = null;

    // 모든 방을 순회하면서 가장 작은 timeSlotDuration을 가진 방 찾기
    hospitalSchedules.rooms.forEach(room => {
      const days = room.weeklySchedule?.current?.days ?? [];
      days.forEach(oh => {
        if (oh.timeSlotDuration && oh.timeSlotDuration > 0 && oh.timeSlotDuration < minDuration) {
          minDuration = oh.timeSlotDuration;
          minRoom = room;
        }
      });
    });

    if (minDuration === Infinity) {
      return { minTimeSlotDuration: 15, minTimeSlotRoom: null }; // 기본값 15분
    }

    return { minTimeSlotDuration: minDuration, minTimeSlotRoom: minRoom };
  }, [hospitalSchedules]);

  // MIN_HEIGHT를 기준으로 slotHeight 계산
  const MIN_HEIGHT = 22;
  const slotHeight = Math.max(MIN_HEIGHT, (minTimeSlotDuration / 10) * MIN_HEIGHT);
  const slotsPerHour = getSlotsPerHour(minTimeSlotDuration);
  const hourHeight = slotHeight * slotsPerHour;

  const { earliestStartTime, latestEndTime } = useMemo(() => {
    if (!hospitalSchedules?.rooms || hospitalSchedules.rooms.length === 0) {
      return { earliestStartTime: '09:00', latestEndTime: '18:00' };
    }

    const allOperatingHours = hospitalSchedules.rooms
      .flatMap(room => room.weeklySchedule?.current?.days || []);

    if (allOperatingHours.length === 0) {
      return { earliestStartTime: '09:00', latestEndTime: '18:00' };
    }

    const startTimes = allOperatingHours.map(oh => oh.startTime).filter((time): time is string => Boolean(time));
    const endTimes = allOperatingHours.map(oh => oh.endTime).filter((time): time is string => Boolean(time));

    const earliestStart = startTimes.length > 0 ? Math.min(...startTimes.map(time => parseInt(time.split(':')[0] ?? '0') * 60 + parseInt(time.split(':')[1] ?? '0'))) : 540; // 09:00
    const latestEnd = endTimes.length > 0 ? Math.max(...endTimes.map(time => parseInt(time.split(':')[0] ?? '0') * 60 + parseInt(time.split(':')[1] ?? '0'))) : 1080; // 18:00

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return {
      earliestStartTime: formatTime(earliestStart),
      latestEndTime: formatTime(latestEnd)
    };
  }, [hospitalSchedules]);

  // 주간 범위가 변경될 때 부모에게 알림
  useEffect(() => {
    if (onWeekRangeChange && weekDates.length >= 7) {
      onWeekRangeChange({
        start: weekDates[0]!,
        end: weekDates[6]!
      });
    }
  }, [currentDate]); // onWeekRangeChange 제거

  // handleTimeSlotClick 함수는 TimeSlotGrid 컴포넌트에서 처리됨

  // appointmentRoom이 없으면 렌더링하지 않음
  const appointmentRoom = minTimeSlotRoom || hospitalSchedules?.rooms?.[0];

  if (!appointmentRoom) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        예약실 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-auto">
      {/* 주간 헤더 */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-gray-200 bg-[var(--bg-1)]">
        <div className="p-2"></div>
        {weekDates.map((date, index) => (
          <div key={index} className="p-2 text-center text-sm border-l border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[var(--gray-400)] font-medium">{['일', '월', '화', '수', '목', '금', '토'][index]}</span>
              <span className={`${isSameDay(date, new Date()) ? 'bg-[var(--main-color)] font-bold text-white rounded-full w-6 h-6 flex items-center justify-center' : 'font-bold'}`}>
                {date.getDate()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 시간 그리드 */}
      <div className="grid grid-cols-1 gap-4">
        <TimeSlotGrid
          hospitalSchedules={hospitalSchedules ?? undefined}
          appointmentRoom={appointmentRoom}
          events={events}
          onTimeSlotClick={onTimeSlotClick}
          onEventClick={onEventClick}
          onDateTimeSelect={onDateTimeSelect}
          onDateChange={onDateChange}
          onDateDoubleClick={onDateDoubleClick}
          weekDates={weekDates}
          overrideSlotHeight={slotHeight}
          overrideHourHeight={hourHeight}
          earliestStartTime={earliestStartTime}
          latestEndTime={latestEndTime}
        />
      </div>
    </div>
  );
};
