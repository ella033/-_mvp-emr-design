import React from 'react';
import { formatTime, getTimeSlots, getSlotsPerHour, isSameDay } from "@/lib/reservation-utils";
import { AppointmentCard } from '../appointment-card';
import { AppointmentHoverCard } from '../appointment-hover-card';
import { TimeSlotCell } from './shared/time-slot-cell';
import { ContextMenu } from './shared/context-menu';
import { ClosureCard } from './shared/closure-card';
import { HolidayCard } from './shared/holiday-card';
import { useTimeSlot } from '@/hooks/appointment-contents-panel/use-time-slot';
import { useHoverCard } from '@/hooks/appointment-contents-panel/use-hover-card';
import { useContextMenu } from '@/hooks/appointment-contents-panel/use-context-menu';
import type { AppointmentRoom, HospitalSchedule } from '@/types/calendar-types';

interface CalendarEvent {
  id: string;
  title: string;
  memo?: string;
  start: Date;
  end: Date;
  color?: string;
  patientId?: number;
  patientName?: string;
  patientPhone?: string;
  appointmentRoomId: number;
  status: number;
  isSimplePatient: boolean;
  originalData?: any;
}

interface WeeklyTimeSlotProps {
  appointmentRoom: AppointmentRoom;
  hospitalSchedules?: HospitalSchedule;
  events: CalendarEvent[];
  weekDates: Date[];
  overrideSlotHeight?: number;
  overrideHourHeight?: number;
  earliestStartTime?: string;
  latestEndTime?: string;
  onTimeSlotClick?: (date: Date, time: { start: string; end: string }, appointmentRoom: AppointmentRoom, isContextMenu?: boolean) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date, newTime: { start: string; end: string }) => void;
  onContextMenu?: (event: CalendarEvent, position: { x: number; y: number }) => void;
  onDateTimeSelect?: (date: Date, time?: { hour: number; minute: number }) => void;
  onDateChange?: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
}

interface EventLayout {
  event: CalendarEvent;
  top: number;
  height: number;
  left: string;
  width: string;
}

const MIN_TEXT_HEIGHT = 20;

// 동일 시작 시간별로 그룹화
const groupByStartTime = (events: CalendarEvent[]): Map<number, CalendarEvent[]> => {
  const groups = new Map<number, CalendarEvent[]>();

  events.forEach(event => {
    const startTime = event.start.getTime();
    if (!groups.has(startTime)) {
      groups.set(startTime, []);
    }
    groups.get(startTime)!.push(event);
  });

  return groups;
};

// 겹치는 이벤트 감지 (시작 시간 기준)
const findOverlappingGroups = (events: CalendarEvent[]): CalendarEvent[][] => {
  if (events.length === 0) return [];

  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [sortedEvents[0]!];
  let currentStartTime = sortedEvents[0]!.start.getTime();

  for (let i = 1; i < sortedEvents.length; i++) {
    const event = sortedEvents[i];
    if (!event) continue;

    const eventStart = event.start.getTime();

    // 시작 시간이 동일하면 같은 그룹
    if (eventStart === currentStartTime) {
      currentGroup.push(event);
    } else {
      // 시작 시간이 다르면 새 그룹 시작
      groups.push(currentGroup);
      currentGroup = [event];
      currentStartTime = eventStart;
    }
  }
  groups.push(currentGroup);

  return groups;
};

// 동시에 겹치는 최대 이벤트 개수 계산
const getMaxSimultaneousEvents = (events: CalendarEvent[]): number => {
  const timePoints: { time: number; isStart: boolean }[] = [];

  events.forEach(event => {
    timePoints.push({ time: event.start.getTime(), isStart: true });
    timePoints.push({ time: event.end.getTime(), isStart: false });
  });

  timePoints.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.isStart ? -1 : 1; // 같은 시간이면 시작이 먼저
  });

  let current = 0;
  let max = 0;

  timePoints.forEach(point => {
    if (point.isStart) {
      current++;
      max = Math.max(max, current);
    } else {
      current--;
    }
  });

  return max;
};

// 이벤트 레이아웃 계산 함수
const calculateEventLayouts = (
  events: CalendarEvent[],
  fromHour: number,
  hourHeight: number
): EventLayout[] => {
  const overlappingGroups = findOverlappingGroups(events);
  const layouts: EventLayout[] = [];

  overlappingGroups.forEach(group => {
    const columnCount = getMaxSimultaneousEvents(group);
    const columnWidth = `calc(100% / ${columnCount})`;

    // 동일 시작 시간별로 그룹화
    const startTimeGroups = groupByStartTime(group);

    // 각 컬럼의 마지막 종료 시간 추적
    const columnEndTimes: number[] = new Array(columnCount).fill(0);

    // 시작 시간 순으로 처리
    Array.from(startTimeGroups.keys()).sort((a, b) => a - b).forEach(startTime => {
      const sameStartEvents = startTimeGroups.get(startTime)!;

      // 동일 시작 시간의 이벤트들은 각각 다른 컬럼에 배치
      // 각 컬럼의 현재 상태 초기화 (동일 시작 시간 그룹마다)
      const usedColumns = new Set<number>();

      sameStartEvents.forEach((event, eventIdx) => {
        const startHour = event.start.getHours();
        const startMinute = event.start.getMinutes();
        const endHour = event.end.getHours();
        const endMinute = event.end.getMinutes();

        const startPosition = (startHour - fromHour) * hourHeight + (startMinute / 60) * hourHeight;
        const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
        const eventHeight = Math.max(durationHours * hourHeight, MIN_TEXT_HEIGHT);

        // 동일 시작 시간 그룹 내에서는 순차적으로 컬럼 할당
        let colIdx = eventIdx % columnCount;

        // 이미 사용된 컬럼이면 다음 사용 가능한 컬럼 찾기
        while (usedColumns.has(colIdx)) {
          colIdx = (colIdx + 1) % columnCount;
        }

        usedColumns.add(colIdx);

        // 컬럼의 종료 시간 업데이트
        columnEndTimes[colIdx] = event.end.getTime();

        const eventLeft = `calc(${columnWidth} * ${colIdx})`;

        layouts.push({
          event,
          top: startPosition,
          height: eventHeight,
          left: eventLeft,
          width: columnWidth
        });
      });
    });
  });

  // 시작 시간이 이른 것부터 렌더링 → 늦은 것이 나중에 렌더링되어 위에 표시
  return layouts.sort((a, b) => a.top - b.top);
};

export const WeeklyTimeSlot: React.FC<WeeklyTimeSlotProps> = ({
  appointmentRoom,
  hospitalSchedules,
  events,
  weekDates,
  overrideSlotHeight,
  overrideHourHeight,
  earliestStartTime: _earliestStartTime,
  latestEndTime: _latestEndTime,
  onTimeSlotClick,
  onEventClick,
  onContextMenu,
  onDateTimeSelect: _onDateTimeSelect,
  onDateChange,
  onDateDoubleClick
}) => {
  const timeSlotLogic = useTimeSlot(appointmentRoom, hospitalSchedules);
  const hoverCard = useHoverCard();
  const contextMenu = useContextMenu(appointmentRoom, timeSlotLogic, 'weekly');
  const [contextMenuDate, setContextMenuDate] = React.useState<Date | null>(null);

  const parseTimeToMinutes = (time?: string): number | null => {
    if (!time) return null;
    const [h, m] = time.split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const calculateSlotHeight = (timeInterval: number): number => {
    return Math.max(25, (timeInterval / 10) * 25);
  };

  const calculateHourHeight = (timeInterval: number): number => {
    const slotHeight = calculateSlotHeight(timeInterval);
    const slotsPerHour = getSlotsPerHour(timeInterval);
    return slotHeight * slotsPerHour;
  };

  const handleTimeSlotDoubleClick = (date: Date, _hour: number, _minute: number) => {
    if (weekDates && onDateDoubleClick) {
      onDateDoubleClick(date);
    }
  };

  const handleEventContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const position = { x: e.clientX, y: e.clientY };
    onContextMenu?.(event, position);
  };

  const handleEventMouseEnter = (event: CalendarEvent, e: React.MouseEvent) => {
    hoverCard.handleMouseEnter(event, e);
  };

  const handleCreateAppointment = (date: Date) => {
    if (!contextMenu.contextMenu) return;

    const { hour, minute } = contextMenu.contextMenu;

    // 현재 운영 시간 정보를 가져와서 timeInterval 계산
    const currentOH = timeSlotLogic.getCurrentOperatingHours(date);
    const timeInterval = currentOH?.timeSlotDuration || 60; // weekly는 기본 60분

    // startTime 계산
    const startTimeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // endTime 계산 (timeInterval 만큼 더함)
    const endMinute = minute + timeInterval;
    const endHour = endMinute >= 60 ? hour + 1 : hour;
    const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinuteFinal.toString().padStart(2, '0')}`;

    if (onTimeSlotClick) {
      onTimeSlotClick(date, { start: startTimeString, end: endTimeString }, appointmentRoom, true);
    }

    contextMenu.setContextMenu(null);
  };

  const weekDaysOfWeek = weekDates.map((date) => date.getDay());

  const getRoomRangeMinutesForDays = (
    dayOfWeeks: number[]
  ): { start: number; end: number } | null => {
    const rooms = hospitalSchedules?.rooms ?? [];
    const operatingHoursFromAllRooms =
      rooms.length > 0
        ? rooms.flatMap((room) => room.weeklySchedule?.current?.days || [])
        : appointmentRoom.weeklySchedule?.current?.days || [];

    const activeOHs = operatingHoursFromAllRooms.filter(
      (oh) => dayOfWeeks.includes(oh.dayOfWeek)
    );

    const startMinutes = activeOHs
      .map((oh) => parseTimeToMinutes(oh.startTime))
      .filter((v): v is number => typeof v === "number");
    const endMinutes = activeOHs
      .map((oh) => parseTimeToMinutes(oh.endTime))
      .filter((v): v is number => typeof v === "number");

    if (startMinutes.length === 0 || endMinutes.length === 0) return null;
    return { start: Math.min(...startMinutes), end: Math.max(...endMinutes) };
  };

  // Weekly View: hospitalSchedules.rooms 전체를 기준으로 주간 공통 시간축(from/to)을 계산
  const weekRange = getRoomRangeMinutesForDays(weekDaysOfWeek);
  const earliestStartMinutes = weekRange?.start ?? 9 * 60;
  const latestEndMinutes = weekRange?.end ?? 18 * 60;

  const fromHour = Math.floor(earliestStartMinutes / 60);
  const fromMinute = earliestStartMinutes % 60;
  const toHour = Math.floor(latestEndMinutes / 60);
  const toMinute = latestEndMinutes % 60;

  const timeInterval = 60;

  // 시간 라벨은 마지막 정시 시간까지 표시
  // 정시 종료: 09:00~18:00 → 09:00~17:00 라벨
  // 분 단위 종료: 09:00~19:30 → 09:00~19:00 라벨 (19:00~19:30 구간 존재)
  // getTimeSlots는 toHour를 포함하지 않으므로, toMinute가 있으면 +1, 정시면 그대로
  const labelToHour = toMinute > 0 ? toHour + 1 : toHour;
  const hours = getTimeSlots(fromHour, labelToHour);
  const slotsPerHour = 1;
  const slotHeight = overrideSlotHeight || calculateSlotHeight(timeInterval);
  const hourHeight = overrideHourHeight || calculateHourHeight(timeInterval);

  return (
    <>
      <div className="grid grid-cols-[50px_repeat(7,1fr)]">
        {/* 시간 라벨 */}
        <div className="border-r border-gray-300 bg-gray-50">
          {hours.map((hour, index) => {
            const isLastLabel = index === hours.length - 1;
            // 정시 종료(toMinute === 0)이고 마지막 라벨인 경우 border 제거
            const shouldRemoveBorder = toMinute === 0 && isLastLabel;

            return (
              <div
                key={hour}
                className={`text-sm text-gray-600 p-2 flex items-start font-medium ${shouldRemoveBorder ? '' : 'border-b border-gray-300'}`}
                style={{ height: `${hourHeight}px` }}
              >
                {formatTime(hour)}
              </div>
            );
          })}
        </div>

        {/* 각 요일 */}
        {weekDates.map((date, dayIndex) => {
          const holiday = timeSlotLogic.getHoliday(date);
          const currentHospitalOH = timeSlotLogic.getHospitalOperatingHours(date);

          // 해당 요일의 모든 예약실 operatingHours 중 최소/최대 범위
          const dayRange = getRoomRangeMinutesForDays([date.getDay()]);

          // 해당 요일의 Hospital 운영시간 파싱
          const hospitalFromHour = currentHospitalOH ? parseInt(currentHospitalOH.startTime?.split(':')[0] || '0') : fromHour;
          const hospitalFromMinute = currentHospitalOH ? parseInt(currentHospitalOH.startTime?.split(':')[1] || '0') : fromMinute;
          const hospitalToHour = currentHospitalOH ? parseInt(currentHospitalOH.endTime?.split(':')[0] || '0') : toHour;
          const hospitalToMinute = currentHospitalOH ? parseInt(currentHospitalOH.endTime?.split(':')[1] || '0') : toMinute;

          // AppointmentRoom(전체) 운영시간 파싱 (해당 요일의 운영시간들 중 최소/최대 범위)
          const roomFromHour = dayRange ? Math.floor(dayRange.start / 60) : hospitalFromHour;
          const roomFromMinute = dayRange ? dayRange.start % 60 : hospitalFromMinute;
          const roomToHour = dayRange ? Math.floor(dayRange.end / 60) : hospitalToHour;
          const roomToMinute = dayRange ? dayRange.end % 60 : hospitalToMinute;

          const dayEvents = events.filter(event =>
            event && event.start && event.start instanceof Date &&
            isSameDay(event.start, date)
          );

          // 해당 요일의 이벤트 레이아웃 계산
          const eventLayouts = calculateEventLayouts(dayEvents, fromHour, hourHeight);

          return (
            <div key={dayIndex} className="border-l border-gray-300 relative">
              {/* 병원 기준 휴게시간 표시 */}
              {currentHospitalOH?.breakTimes && currentHospitalOH.breakTimes.length > 0 &&
                currentHospitalOH.breakTimes.map((breakTime) => {
                  const breakTimeStartHour = parseInt(breakTime.breakStart?.split(':')[0] || '0');
                  const breakTimeStartMinute = parseInt(breakTime.breakStart?.split(':')[1] || '0');
                  const breakTimeEndHour = parseInt(breakTime.breakEnd?.split(':')[0] || '0');
                  const breakTimeEndMinute = parseInt(breakTime.breakEnd?.split(':')[1] || '0');

                  const startPosition = (breakTimeStartHour - fromHour) * hourHeight + (breakTimeStartMinute / 60) * hourHeight;
                  const durationHours = (breakTimeEndHour - breakTimeStartHour) + (breakTimeEndMinute - breakTimeStartMinute) / 60;
                  const breakTimeHeight = durationHours * hourHeight;

                  return (
                    <ClosureCard
                      key={`break-${breakTime.id}`}
                      type="break"
                      title="휴게시간"
                      startTime={breakTime.breakStart}
                      endTime={breakTime.breakEnd}
                      style={{
                        top: `${startPosition}px`,
                        height: `${breakTimeHeight}px`,
                      }}
                    />
                  );
                })
              }

              {/* 시간대별 렌더링 - 1시간 단위 */}
              {hours.map((hour) => {
                // 이 시간대(1시간 슬롯)가 운영시간인지 체크 (분 단위)
                const hourStartInMinutes = hour * 60;

                // Hospital 운영시간 체크
                const hospitalStartInMinutes = hospitalFromHour * 60 + hospitalFromMinute;
                const hospitalEndInMinutes = hospitalToHour * 60 + hospitalToMinute;
                const isOutsideHospitalHours = hourStartInMinutes < hospitalStartInMinutes || hourStartInMinutes >= hospitalEndInMinutes;

                // AppointmentRoom 운영시간 체크
                const roomStartInMinutes = roomFromHour * 60 + roomFromMinute;
                const roomEndInMinutes = roomToHour * 60 + roomToMinute;
                const isOutsideRoomHours = hourStartInMinutes < roomStartInMinutes || hourStartInMinutes >= roomEndInMinutes;

                // 병원 또는 진료실 운영시간 외라면 미운영
                const isNonOperating = isOutsideHospitalHours || isOutsideRoomHours;

                return (
                  <div
                    key={hour}
                    className="relative border-b border-gray-300"
                    style={{ height: `${hourHeight}px` }}
                  >
                    {/* Hospital 또는 AppointmentRoom 운영시간 외 시간대 회색 표시 */}
                    {isNonOperating && (
                      <div className="absolute inset-0 bg-[var(--bg-1)] bg-opacity-70 flex items-center justify-center z-10">
                      </div>
                    )}

                    {/* 1시간 단위 타임슬롯 */}
                    <TimeSlotCell
                      date={date}
                      hour={hour}
                      minute={0}
                      timeInterval={timeInterval}
                      slotsPerHour={slotsPerHour}
                      slotHeight={slotHeight}
                      isLastSlot={true}
                      isAvailable={true} // Weekly View에서는 드래그 오버레이를 위해 항상 true
                      isBreak={false}
                      isClosure={false}
                      isDailyView={false}
                      viewType="weekly"
                      appointmentRoomId={appointmentRoom.id}
                      appointmentRoomName={appointmentRoom.name}
                      onTimeSlotDoubleClick={handleTimeSlotDoubleClick}
                      onContextMenu={(e, hour, minute) => {
                        setContextMenuDate(date);
                        contextMenu.handleContextMenu(e, hour, minute);
                      }}
                    />
                  </div>
                );
              })}

              {/* 예약카드 표시 - 계산된 레이아웃 사용 */}
              {eventLayouts.map(layout => (
                <AppointmentCard
                  key={layout.event.id}
                  appointment={layout.event}
                  viewType="weekly"
                  onDoubleClick={onEventClick}
                  onContextMenu={(e) => handleEventContextMenu(layout.event, e)}
                  onMouseEnter={(e) => handleEventMouseEnter(layout.event, e)}
                  onMouseLeave={hoverCard.handleMouseLeave}
                  style={{
                    position: 'absolute',
                    top: `${layout.top}px`,
                    left: layout.left,
                    width: layout.width,
                    height: `${layout.height}px`,
                  }}
                  className="draggable-appointment"
                  useCustomLayout={true}
                  isDraggable={true}
                />
              ))}

              {/* 공휴일/휴진일 오버레이 */}
              {(holiday || !dayRange) && (
                <HolidayCard
                  holiday={holiday}
                  currentDate={date}
                  style={{
                    top: '0px',
                    left: '0px',
                    right: '0px',
                    height: `${hours.length * hourHeight}px`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Hover Card (weekly-view) */}
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

      {/* Context Menu */}
      {contextMenuDate && (
        <ContextMenu
          contextMenu={contextMenu.contextMenu}
          currentDate={contextMenuDate}
          isAvailable={contextMenu.contextMenu ? timeSlotLogic.isTimeSlotAvailable(contextMenuDate, contextMenu.contextMenu.hour, contextMenu.contextMenu.minute) : false}
          isClosureTime={contextMenu.contextMenu ? (() => {
            const timeString = `${contextMenu.contextMenu.hour.toString().padStart(2, '0')}:${contextMenu.contextMenu.minute.toString().padStart(2, '0')}`;
            const currentClosures = timeSlotLogic.getCurrentClosures(contextMenuDate);
            return currentClosures.some(closure => {
              return timeString >= closure.startTime && timeString < closure.endTime;
            });
          })() : false}
          hasCopiedAppointment={contextMenu.hasCopiedAppointment}
          onClose={() => {
            contextMenu.setContextMenu(null);
            setContextMenuDate(null);
          }}
          onCreateAppointment={() => handleCreateAppointment(contextMenuDate)}
          onCreateSlotClosure={() => {
            contextMenu.handleCreateSlotClosure(contextMenuDate, onDateChange);
            setContextMenuDate(null);
          }}
          onCancelSlotClosure={() => {
            contextMenu.handleCancelSlotClosure(contextMenuDate, onDateChange);
            setContextMenuDate(null);
          }}
          onPasteAppointment={() => contextMenu.handlePasteAppointment(contextMenuDate)}
        />
      )}
      {contextMenu.popup}
    </>
  );
};