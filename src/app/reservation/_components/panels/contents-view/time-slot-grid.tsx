
import React from 'react';
import { DailyTimeSlot } from './time-slot-grid/daily-time-slot';
import { WeeklyTimeSlot } from './time-slot-grid/weekly-time-slot';
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

interface TimeSlotGridProps {
  appointmentRoom: AppointmentRoom;
  hospitalSchedules?: HospitalSchedule;
  events: CalendarEvent[];
  currentDate?: Date;
  weekDates?: Date[];
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
  onDateDoubleClick?: (date: Date) => void;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  appointmentRoom,
  hospitalSchedules,
  events,
  currentDate,
  weekDates,
  showTimeLabels = true,
  showCurrentTime = true,
  overrideSlotHeight,
  overrideHourHeight,
  earliestStartTime,
  latestEndTime,
  onTimeSlotClick,
  onEventClick,
  onEventDrop,
  onContextMenu,
  onDateTimeSelect,
  onDateChange,
  onDateDoubleClick
}) => {
  // Daily View 렌더링
  if (currentDate && !weekDates) {
    return (
      <DailyTimeSlot
        appointmentRoom={appointmentRoom}
        hospitalSchedules={hospitalSchedules}
        events={events}
        currentDate={currentDate}
        showTimeLabels={showTimeLabels}
        showCurrentTime={showCurrentTime}
        overrideSlotHeight={overrideSlotHeight}
        overrideHourHeight={overrideHourHeight}
        onTimeSlotClick={onTimeSlotClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        onContextMenu={onContextMenu}
        onDateTimeSelect={onDateTimeSelect}
        onDateChange={onDateChange}
      />
    );
  }

  // Weekly View 렌더링
  if (weekDates) {
    return (
      <WeeklyTimeSlot
        appointmentRoom={appointmentRoom}
        hospitalSchedules={hospitalSchedules}
        events={events}
        weekDates={weekDates}
        overrideSlotHeight={overrideSlotHeight}
        overrideHourHeight={overrideHourHeight}
        earliestStartTime={earliestStartTime}
        latestEndTime={latestEndTime}
        onTimeSlotClick={onTimeSlotClick}
        onEventClick={onEventClick}
        onEventDrop={onEventDrop}
        onContextMenu={onContextMenu}
        onDateTimeSelect={onDateTimeSelect}
        onDateChange={onDateChange}
        onDateDoubleClick={onDateDoubleClick}
      />
    );
  }

  return null;
}; 