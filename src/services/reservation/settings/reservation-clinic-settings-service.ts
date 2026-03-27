import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";
import type { OperatingHours } from "@/types/calendar-types";

// 타입 정의
export interface BreakTimes {
  id: number;
  breakStart: string;
  breakEnd: string;
  breakName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ClinicSchedule {
  id: string;
  dayOfWeek: number[]; // [1,2,3,4,5] 형태 (0: 일요일, 1: 월요일, ...)
  startTime: string;
  endTime: string;
  timeSlotDuration: number;
  breakTimes: BreakTimes[];
}

export interface ScheduleItem {
  id: string;
  clinicSchedule: ClinicSchedule;
}

export interface OperatingHoursData {
  appointmentRoomId: number | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeSlotDuration: number;
  isActive: boolean;
  breakTimes: BreakTimes[];
}

/**
 * 시간 문자열을 분으로 변환하는 유틸리티 함수
 * @param time - "HH:mm" 형식의 시간 문자열
 * @returns 분 단위로 변환된 숫자 (변환 실패 시 NaN)
 */
export const parseTimeToMinutes = (time?: string): number => {
  if (!time) return NaN;
  const [hoursStr = "", minutesStr = ""] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return NaN;
  return hours * 60 + minutes;
};

/**
 * ScheduleItem 배열을 OperatingHoursData 배열로 변환
 * @param schedules - 변환할 ScheduleItem 배열
 * @returns OperatingHoursData 배열
 */
export const convertSchedulesToOperatingHoursData = (
  schedules: ScheduleItem[]
): OperatingHoursData[] => {
  return schedules.flatMap((schedule) =>
    schedule.clinicSchedule.dayOfWeek.map((day) => {
      const breakTimes = schedule.clinicSchedule.breakTimes.map((bt) => ({
        id: bt.id,
        breakStart: bt.breakStart,
        breakEnd: bt.breakEnd,
        breakName: bt.breakName,
        sortOrder: bt.sortOrder,
        isActive: bt.isActive,
      }));

      return {
        appointmentRoomId: null,
        dayOfWeek: day,
        startTime: schedule.clinicSchedule.startTime,
        endTime: schedule.clinicSchedule.endTime,
        timeSlotDuration: schedule.clinicSchedule.timeSlotDuration,
        isActive: true,
        breakTimes: breakTimes,
      };
    })
  );
};

/**
 * OperatingHours 배열을 ScheduleItem 배열로 변환
 * @param operatingHours - 변환할 OperatingHours 배열
 * @returns ScheduleItem 배열
 */
export const convertOperatingHoursToSchedules = (
  operatingHours: any[]
): ScheduleItem[] => {
  if (!operatingHours || operatingHours.length === 0) {
    return [];
  }

  // operatingHours를 요일별로 그룹화
  // groupedByDay: { [dayOfWeek: number]: OperatingHours[] }
  // 예: { 1: [OperatingHours, OperatingHours], 2: [OperatingHours] }
  const groupedByDay = operatingHours.reduce((acc, oh) => {
    const day = oh.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(oh);
    return acc;
  }, {} as Record<number, OperatingHours[]>);

  // 각 요일 그룹을 하나의 스케줄로 변환
  // hours: 특정 요일에 해당하는 OperatingHours 배열
  // 같은 요일에 여러 operatingHours가 있어도 첫 번째 것만 사용 (동일한 시간 설정을 가정)
  const scheduleGroups = Object.entries(groupedByDay)
    .map(([day, hours]) => {
      // hours는 OperatingHours[] 타입
      const operatingHoursForDay = hours as OperatingHours[];
      const firstHour = operatingHoursForDay[0];

      // 안전성 체크 (이론적으로는 발생하지 않아야 하지만)
      if (!firstHour) {
        return null;
      }

      const breakTimes =
        firstHour.breakTimes?.map((bt: any, index: number) => ({
          id: bt.id || index + 1,
          breakStart: bt.breakStart,
          breakEnd: bt.breakEnd,
          breakName: bt.breakName || "",
          sortOrder: bt.sortOrder || index,
          isActive: bt.isActive !== false,
        })) || [];

      return {
        dayOfWeek: parseInt(day),
        startTime: firstHour.startTime,
        endTime: firstHour.endTime,
        timeSlotDuration: firstHour.timeSlotDuration || 30,
        breakTimes: breakTimes,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  // 동일한 시간 설정을 가진 그룹들을 하나의 스케줄로 병합
  const mergedSchedules = scheduleGroups.reduce((acc, group) => {
    const existingSchedule = acc.find(
      (s) =>
        s.clinicSchedule.startTime === group.startTime &&
        s.clinicSchedule.endTime === group.endTime &&
        s.clinicSchedule.timeSlotDuration === group.timeSlotDuration
    );

    if (existingSchedule) {
      existingSchedule.clinicSchedule.dayOfWeek.push(group.dayOfWeek);
    } else {
      acc.push({
        id: `schedule_${Date.now()}_${acc.length}`,
        clinicSchedule: {
          id: `clinic_${Date.now()}_${acc.length}`,
          dayOfWeek: [group.dayOfWeek],
          startTime: group.startTime,
          endTime: group.endTime,
          timeSlotDuration: group.timeSlotDuration,
          breakTimes: group.breakTimes,
        },
      });
    }
    return acc;
  }, [] as ScheduleItem[]);

  return mergedSchedules;
};

/**
 * 저장하려는 운영시간 데이터를 기준으로 예약실 운영시간 경고 검증
 * @param operatingHoursData - 검증할 운영시간 데이터 배열
 * @param appointmentRooms - 예약실 배열
 * @returns 경고가 발생한 예약실 이름 배열
 */
export const getRoomOperatingHourWarnings = (
  operatingHoursData: OperatingHoursData[],
  appointmentRooms: AppointmentRooms[]
): string[] => {
  if (!operatingHoursData || operatingHoursData.length === 0) {
    return [];
  }
  const rooms = appointmentRooms ?? [];
  const warnings = new Set<string>();

  operatingHoursData.forEach((hospitalHour) => {
    const hospitalStart = parseTimeToMinutes(hospitalHour.startTime);
    const hospitalEnd = parseTimeToMinutes(hospitalHour.endTime);

    rooms.forEach((room) => {
      const roomHours = (room as any).weeklySchedule?.current?.days?.filter(
        (roomHour: any) => roomHour.dayOfWeek === hospitalHour.dayOfWeek
      );

      roomHours?.forEach((roomHour) => {
        const roomStart = parseTimeToMinutes(roomHour.startTime);
        const roomEnd = parseTimeToMinutes(roomHour.endTime);

        const isStartLater =
          !Number.isNaN(hospitalStart) &&
          !Number.isNaN(roomStart) &&
          hospitalStart > roomStart;
        const isEndEarlier =
          !Number.isNaN(hospitalEnd) &&
          !Number.isNaN(roomEnd) &&
          hospitalEnd < roomEnd;

        if (isStartLater || isEndEarlier) {
          warnings.add(room.displayName || room.name || `예약실 ${room.id}`);
        }
      });
    });
  });

  return Array.from(warnings);
};

