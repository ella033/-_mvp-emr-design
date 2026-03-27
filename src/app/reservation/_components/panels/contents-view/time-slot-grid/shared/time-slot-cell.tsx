import React, { useState, useEffect } from 'react';
import { formatTime } from "@/lib/reservation-utils";
import { ClosureCard } from './closure-card';

interface TimeSlotCellProps {
  date: Date;
  hour: number;
  minute: number;
  timeInterval: number;
  slotsPerHour: number;
  slotHeight: number;
  isLastSlot: boolean;
  isAvailable: boolean;
  isBreak: boolean;
  isClosure: boolean;
  breakTime?: any;
  closure?: any;
  isDailyView?: boolean;
  viewType?: 'daily' | 'weekly' | 'monthly';
  appointmentRoomId?: number | null;
  appointmentRoomName?: string | null;
  doctorId?: number | null;
  doctorName?: string | null;
  absoluteTopPx?: number;
  absoluteHeightPx?: number;
  onTimeSlotClick?: (date: Date, hour: number, minute: number) => void;
  onTimeSlotDoubleClick?: (date: Date, hour: number, minute: number) => void;
  onContextMenu?: (e: React.MouseEvent, hour: number, minute: number) => void;
}

export const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  date,
  hour,
  minute,
  timeInterval,
  slotsPerHour,
  slotHeight,
  isLastSlot,
  isAvailable,
  isBreak,
  isClosure,
  breakTime,
  closure,
  isDailyView = true,
  viewType = 'daily',
  appointmentRoomId,
  appointmentRoomName,
  doctorId,
  doctorName,
  absoluteTopPx,
  absoluteHeightPx,
  onTimeSlotClick,
  onTimeSlotDoubleClick,
  onContextMenu
}) => {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount === 2) {
      onTimeSlotDoubleClick?.(date, hour, minute);
      setClickCount(0);
    }
  }, [clickCount, date, hour, minute, onTimeSlotDoubleClick]);

  // 시작 시간 문자열 생성
  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  // 종료 시간 계산
  const endMinute = minute + timeInterval;
  const endHour = endMinute >= 60 ? hour + 1 : hour;
  const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinuteFinal.toString().padStart(2, '0')}`;

  // 날짜 문자열 (YYYY-MM-DD)
  const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

  return (
    <div
      key={`${hour}-${minute}`}
      data-testid="reservation-time-slot"
      data-drop-target="true"
      data-date={dateString}
      data-start-time={startTime}
      data-end-time={endTime}
      data-time-interval={timeInterval}
      data-view-type={viewType}
      data-appointment-room-id={appointmentRoomId}
      data-appointment-room-name={appointmentRoomName}
      data-doctor-id={doctorId}
      data-doctor-name={doctorName}
      className={`absolute inset-x-0 transition-colors group ${isAvailable
        ? 'cursor-pointer hover:bg-blue-50'
        : 'cursor-not-allowed'
        } ${!isLastSlot ? 'border-b border-gray-200' : ''}`}
      style={absoluteTopPx !== undefined && absoluteHeightPx !== undefined
        ? {
            top: `${absoluteTopPx}px`,
            height: `${absoluteHeightPx}px`,
            minHeight: `${slotHeight}px`,
          }
        : {
            top: `${(minute / timeInterval / slotsPerHour) * 100}%`,
            height: `${100 / slotsPerHour}%`,
            minHeight: `${slotHeight}px`,
          }
      }
      onClick={(e) => {
        if (!isAvailable) return;
        e.stopPropagation();

        // daily view에서는 예약 생성, weekly view에서는 더블클릭 감지
        if (isDailyView) {
          onTimeSlotClick?.(date, hour, minute);
        } else {
          setClickCount(prev => prev + 1);
          // 300ms 후 클릭 카운터 리셋
          setTimeout(() => setClickCount(0), 300);
        }
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTimeSlotDoubleClick?.(date, hour, minute);
      }}
      onContextMenu={(e) => {
        // context menu 동작
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, hour, minute);
        }
      }}
    >
      {/* Daily View에서만 시간 표시 */}
      {isDailyView && (
        <div
          className={`absolute top-0 left-0 w-10 h-full flex flex-col items-center justify-start text-xs z-20 text-gray-500 ${isBreak ? 'bg-[var(--bg-1)]' : isClosure ? 'bg-[var(--bg-3)]' : ''} border-gray-200 cursor-pointer hover:bg-gray-100`}
          onContextMenu={(e) => onContextMenu?.(e, hour, minute)}
        >
          <div className="pt-1">{formatTime(hour, minute)}</div>
          {isClosure && slotHeight >= 30 && <div className="text-xs font-semibold text-gray-500">마감</div>}
        </div>
      )}

      {/* 카드 영역 */}
      <div className={`absolute top-0 right-0 h-full ${isDailyView ? 'left-10' : 'left-0'}`}>
        {!isAvailable && (isBreak || isClosure) && (
          <ClosureCard
            type={isBreak ? 'break' : 'closure'}
            title={isBreak ? '휴게시간' : (closure?.reason || '마감')}
            startTime={isBreak ? breakTime?.breakStart : closure?.startTime}
            endTime={isBreak ? breakTime?.breakEnd : closure?.endTime}
            reason={closure?.reason}
            slotClosureId={closure?.id || 0}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}; 
