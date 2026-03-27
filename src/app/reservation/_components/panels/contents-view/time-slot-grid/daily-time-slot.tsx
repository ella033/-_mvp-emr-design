import React, { useEffect, useRef } from 'react';
import { formatTime, getTimeSlots, getSlotsPerHour, isSameDay } from "@/lib/reservation-utils";
import { AppointmentCard } from '../appointment-card';
import { TimeSlotCell } from './shared/time-slot-cell';
import { ContextMenu } from './shared/context-menu';
import { ClosureCard } from './shared/closure-card';
import { HolidayCard } from './shared/holiday-card';
import { useTimeSlot } from '@/hooks/appointment-contents-panel/use-time-slot';
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

interface DailyTimeSlotProps {
  appointmentRoom: AppointmentRoom;
  hospitalSchedules?: HospitalSchedule;
  events: CalendarEvent[];
  currentDate: Date;
  showTimeLabels?: boolean;
  showCurrentTime?: boolean;
  overrideSlotHeight?: number;
  overrideHourHeight?: number;
  earliestStartTime?: string;
  latestEndTime?: string;
  onTimeSlotClick?: (date: Date, time: { start: string; end: string }, appointmentRoom: AppointmentRoom, isContextMenu?: boolean) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date, newTime: { start: string; end: string }) => void;
  onContextMenu?: (event: CalendarEvent, position: { x: number; y: number }) => void;
  onDateTimeSelect?: (date: Date, time?: { hour: number; minute: number }, appointmentRoom?: AppointmentRoom) => void;
  onDateChange?: (date: Date) => void;
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

const calculateEventLayouts = (
  events: CalendarEvent[],
  fromHour: number,
  hourHeight: number
): EventLayout[] => {
  const overlappingGroups = findOverlappingGroups(events);
  const layouts: EventLayout[] = [];

  overlappingGroups.forEach(group => {
    const columnCount = getMaxSimultaneousEvents(group);
    const columnWidth = `calc((100% - 45px) / ${columnCount})`;

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

        const eventLeft = `calc(45px + ${columnWidth} * ${colIdx})`;
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

export const DailyTimeSlot: React.FC<DailyTimeSlotProps> = ({
  appointmentRoom,
  hospitalSchedules,
  events,
  currentDate,
  showTimeLabels = true,
  showCurrentTime = true,
  overrideSlotHeight,
  overrideHourHeight,
  onTimeSlotClick,
  onEventClick,
  onContextMenu,
  onDateTimeSelect,
  onDateChange
}) => {
  const timeSlotLogic = useTimeSlot(appointmentRoom, hospitalSchedules);
  const contextMenu = useContextMenu(appointmentRoom, timeSlotLogic, 'daily');
  const currentTimeLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 시간 줄로 스크롤 (오늘 날짜일 때만, 첫 번째 예약실에서만)
  useEffect(() => {
    if (showCurrentTime && isSameDay(currentDate, new Date()) && currentTimeLineRef.current && containerRef.current) {
      // 약간의 딜레이를 주어 렌더링이 완료된 후 스크롤
      const timer = setTimeout(() => {
        if (currentTimeLineRef.current) {
          // 현재 시간 줄을 화면 중앙에 배치
          currentTimeLineRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentDate, appointmentRoom.id, showCurrentTime]); // appointmentRoom 변경 시에도 다시 스크롤

  const calculateSlotHeight = (timeInterval: number): number => {
    const MIN_HEIGHT = 20;
    const MAX_HEIGHT = 60;
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, (timeInterval / 10) * MIN_HEIGHT));
  };

  const calculateHourHeight = (timeInterval: number): number => {
    const slotHeight = calculateSlotHeight(timeInterval);
    const slotsPerHour = getSlotsPerHour(timeInterval);
    return slotHeight * slotsPerHour;
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    if (!timeSlotLogic.isTimeSlotAvailable(date, hour, minute)) return;

    const currentOH = timeSlotLogic.getCurrentOperatingHours(date);
    const timeInterval = currentOH?.timeSlotDuration || 15;

    const startTimeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const endMinute = minute + timeInterval;
    const endHour = endMinute >= 60 ? hour + 1 : hour;
    const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinuteFinal.toString().padStart(2, '0')}`;

    onTimeSlotClick?.(date, { start: startTimeString, end: endTimeString }, appointmentRoom);
    onDateTimeSelect?.(date, { hour, minute }, appointmentRoom);
    onDateChange?.(date);
  };

  const handleCreateAppointment = () => {
    if (!contextMenu.contextMenu || !currentDate) return;

    const { hour, minute } = contextMenu.contextMenu;

    // 현재 운영 시간 정보를 가져와서 timeInterval 계산
    const currentOH = timeSlotLogic.getCurrentOperatingHours(currentDate);
    const timeInterval = currentOH?.timeSlotDuration || 15;

    // startTime 계산
    const startTimeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // endTime 계산 (timeInterval 만큼 더함)
    const endMinute = minute + timeInterval;
    const endHour = endMinute >= 60 ? hour + 1 : hour;
    const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinuteFinal.toString().padStart(2, '0')}`;

    if (onTimeSlotClick) {
      onTimeSlotClick(currentDate, { start: startTimeString, end: endTimeString }, appointmentRoom, true);
    }

    contextMenu.setContextMenu(null);
  };

  const handleEventContextMenu = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const position = { x: e.clientX, y: e.clientY };
    onContextMenu?.(event, position);
  };

  const holiday = timeSlotLogic.getHoliday(currentDate);
  const currentOH = timeSlotLogic.getCurrentOperatingHours(currentDate);
  const currentHospitalOH = timeSlotLogic.getHospitalOperatingHours(currentDate);
  const baseOH = currentHospitalOH || currentOH;
  const roomOH = currentOH;

  if (!baseOH) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-[var(--bg-base)]">
        <div className="text-center">
          <div>운영시간 정보가 없습니다</div>
        </div>
      </div>
    );
  }

  // Hospital 운영시간 파싱 (baseOH는 hospitalOperatingHours 기준)
  const fromHour = parseInt(baseOH.startTime?.split(':')[0] || '0');
  const fromMinute = parseInt(baseOH.startTime?.split(':')[1] || '0');
  const toHour = parseInt(baseOH.endTime?.split(':')[0] || '0');
  const toMinute = parseInt(baseOH.endTime?.split(':')[1] || '0');

  const timeInterval = roomOH?.timeSlotDuration || 15;

  // 시간 라벨은 마지막 정시 시간까지 표시
  // 정시 종료: 09:00~18:00 → 09:00~17:00 라벨
  // 분 단위 종료: 09:00~19:30 → 09:00~19:00 라벨 (19:00~19:30 구간 존재)
  // getTimeSlots는 toHour를 포함하지 않으므로, toMinute가 있으면 +1, 정시면 그대로
  const labelToHour = toMinute > 0 ? toHour + 1 : toHour;
  const hours = getTimeSlots(fromHour, labelToHour);

  const slotsPerHour = getSlotsPerHour(timeInterval);
  const slotHeight = overrideSlotHeight || calculateSlotHeight(timeInterval);
  const hourHeight = overrideHourHeight || calculateHourHeight(timeInterval);

  // 분 단위 종료시간(toMinute)까지 포함한 실제 그리드 높이(오버레이/휴진 표시용)
  const gridStartMinutes = fromHour * 60 + fromMinute;
  const gridEndMinutes = toHour * 60 + toMinute;
  const gridHeightPx = Math.max(
    0,
    ((gridEndMinutes - gridStartMinutes) / 60) * hourHeight
  );

  // AppointmentRoom 운영시간 파싱
  const roomFromHour = roomOH ? parseInt(roomOH.startTime?.split(':')[0] || '0') : fromHour;
  const roomFromMinute = roomOH ? parseInt(roomOH.startTime?.split(':')[1] || '0') : fromMinute;
  const roomToHour = roomOH ? parseInt(roomOH.endTime?.split(':')[0] || '0') : toHour;
  const roomToMinute = roomOH ? parseInt(roomOH.endTime?.split(':')[1] || '0') : toMinute;

  // Room의 실제 startTime 기준으로 슬롯 생성 (예: 09:05 시작, 15분 간격 → 09:05, 09:20, 09:35, 09:50, 10:05, ...)
  const gridTopMinutes = fromHour * 60; // 그리드 시각적 시작점 (첫 번째 시간 컨테이너 상단)
  const roomStartTotalMinutes = roomFromHour * 60 + roomFromMinute;
  const roomEndTotalMinutes = roomToHour * 60 + roomToMinute;
  const slotHeightPx = (timeInterval / 60) * hourHeight;

  // Room 운영시간 내에서 duration 기준으로 모든 슬롯 위치 계산
  const roomSlots: Array<{ hour: number; minute: number; topPx: number; heightPx: number; isLastSlot: boolean }> = [];
  if (roomOH) {
    for (let slotMin = roomStartTotalMinutes; slotMin < roomEndTotalMinutes; slotMin += timeInterval) {
      const h = Math.floor(slotMin / 60);
      const m = slotMin % 60;
      const topPx = ((slotMin - gridTopMinutes) / 60) * hourHeight;
      // 슬롯 끝이 정시(hour boundary)에 해당하면 isLastSlot (hour 경계선과 겹침 방지)
      const slotEndMinutes = slotMin + timeInterval;
      const isLastSlot = slotEndMinutes % 60 === 0;
      roomSlots.push({ hour: h, minute: m, topPx, heightPx: slotHeightPx, isLastSlot });
    }
  }

  // 비운영 시간 오버레이 계산 (room 운영시간 전/후 영역)
  const totalGridVisualHeightPx = hours.length * hourHeight;
  const preNonOpHeightPx = roomOH
    ? Math.max(0, ((roomStartTotalMinutes - gridTopMinutes) / 60) * hourHeight)
    : totalGridVisualHeightPx;
  const postNonOpTopPx = roomOH
    ? ((roomEndTotalMinutes - gridTopMinutes) / 60) * hourHeight
    : 0;
  const postNonOpHeightPx = roomOH
    ? Math.max(0, totalGridVisualHeightPx - postNonOpTopPx)
    : 0;

  const dayEvents = events.filter(event =>
    event && event.start && event.start instanceof Date &&
    Number(event.originalData?.appointmentRoomId) === appointmentRoom.id &&
    isSameDay(event.start, currentDate)
  );

  const eventLayouts = calculateEventLayouts(dayEvents, fromHour, hourHeight);

  return (
    <>
      <div
        ref={containerRef}
        className={`grid min-h-full ${showTimeLabels ? 'grid-cols-[50px_1fr]' : 'grid-cols-[1fr]'}`}
      >
        {showTimeLabels && (
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
        )}

        <div className="relative bg-white">
          {/* 1시간 단위 시각적 그리드 라인 (border만 표시, 슬롯 셀은 별도 렌더링) */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-gray-300"
              style={{ height: `${hourHeight}px` }}
            />
          ))}

          {/* 병원 기준 휴게시간 오버레이 */}
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

          {/* 비운영 시간 오버레이: room 운영시간 이전 영역 */}
          {preNonOpHeightPx > 0 && (
            <div
              className="absolute inset-x-0 bg-[var(--bg-1)] bg-opacity-70 z-10"
              style={{ top: 0, height: `${preNonOpHeightPx}px` }}
            />
          )}

          {/* 비운영 시간 오버레이: room 운영시간 이후 영역 */}
          {postNonOpHeightPx > 0 && (
            <div
              className="absolute inset-x-0 bg-[var(--bg-1)] bg-opacity-70 z-10"
              style={{ top: `${postNonOpTopPx}px`, height: `${postNonOpHeightPx}px` }}
            />
          )}

          {/* Room의 실제 startTime과 duration 기준으로 생성된 타임슬롯 셀 */}
          {roomSlots.map(slot => {
            const isAvailable = currentOH ? timeSlotLogic.isTimeSlotAvailable(currentDate, slot.hour, slot.minute) : false;
            const { isBreak, breakTime } = timeSlotLogic.isBreakTime(currentDate, slot.hour, slot.minute);
            const { isClosure, closure } = timeSlotLogic.isClosureTime(currentDate, slot.hour, slot.minute);

            return (
              <TimeSlotCell
                key={`${slot.hour}-${slot.minute}`}
                date={currentDate}
                hour={slot.hour}
                minute={slot.minute}
                timeInterval={timeInterval}
                slotsPerHour={slotsPerHour}
                slotHeight={slotHeight}
                isLastSlot={slot.isLastSlot}
                isAvailable={isAvailable}
                isBreak={isBreak}
                isClosure={isClosure}
                breakTime={breakTime}
                closure={closure}
                appointmentRoomId={appointmentRoom.id}
                appointmentRoomName={appointmentRoom.name}
                isDailyView={true}
                viewType="daily"
                absoluteTopPx={slot.topPx}
                absoluteHeightPx={slot.heightPx}
                onTimeSlotClick={handleTimeSlotClick}
                onContextMenu={(e, hour, minute) => contextMenu.handleContextMenu(e, hour, minute)}
              />
            );
          })}

          {eventLayouts.map(layout => (
            <AppointmentCard
              key={layout.event.id}
              appointment={layout.event}
              viewType="daily"
              onDoubleClick={onEventClick}
              onContextMenu={(e) => handleEventContextMenu(layout.event, e)}
              onMouseEnter={undefined}
              onMouseLeave={undefined}
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

          {isSameDay(currentDate, new Date()) && (
            (() => {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();

              if (currentHour >= fromHour && currentHour < toHour) {
                const position = (currentHour - fromHour) * hourHeight + (currentMinute / 60) * hourHeight;

                return (
                  <div
                    ref={currentTimeLineRef}
                    className="absolute left-0 right-0 border-t-2 border-[var(--red-2)]"
                    style={{ top: `${position}px`, zIndex: 50 }}
                  >
                    {showCurrentTime && (
                      <div className="absolute -left-12 -top-4 text-xs rounded-sm text-[var(--bg-main)] font-medium bg-[var(--red-2)] px-1 py-1 border-2 border-[var(--red-2)] shadow-sm">
                        {formatTime(currentHour, currentMinute)}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()
          )}

          {(holiday || !currentOH) && (
            <HolidayCard
              holiday={holiday}
              currentDate={currentDate}
              style={{
                top: '0px',
                left: '0px',
                right: '0px',
                height: `${gridHeightPx}px`,
              }}
            />
          )}
        </div>
      </div>

      <ContextMenu
        contextMenu={contextMenu.contextMenu}
        currentDate={currentDate}
        isAvailable={contextMenu.contextMenu ? timeSlotLogic.isTimeSlotAvailable(currentDate, contextMenu.contextMenu.hour, contextMenu.contextMenu.minute) : false}
        isClosureTime={contextMenu.contextMenu ? (() => {
          const timeString = `${contextMenu.contextMenu.hour.toString().padStart(2, '0')}:${contextMenu.contextMenu.minute.toString().padStart(2, '0')}`;
          const currentClosures = timeSlotLogic.getCurrentClosures(currentDate);
          return currentClosures.some(closure => {
            return timeString >= closure.startTime && timeString < closure.endTime;
          });
        })() : false}
        hasCopiedAppointment={contextMenu.hasCopiedAppointment}
        onClose={() => contextMenu.setContextMenu(null)}
        onCreateAppointment={handleCreateAppointment}
        onCreateSlotClosure={() => contextMenu.handleCreateSlotClosure(currentDate, onDateChange)}
        onCancelSlotClosure={() => contextMenu.handleCancelSlotClosure(currentDate, onDateChange)}
        onPasteAppointment={() => contextMenu.handlePasteAppointment(currentDate)}
      />
      {contextMenu.popup}
    </>
  );
};