import { useMemo, useCallback } from "react";
import type { HospitalSchedule, AppointmentRoom } from "@/types/calendar-types";

// 슬롯 높이 관련 상수
const MIN_HEIGHT = 20;
const MAX_HEIGHT = 60;

interface UseDailyViewProps {
  hospitalSchedules: HospitalSchedule | null;
  currentDate: Date;
  filters?: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  };
}

export function useDailyView({
  hospitalSchedules,
  currentDate,
  filters,
}: UseDailyViewProps) {
  // 날짜 정규화 함수 (시간 부분 제거)
  const normalizeDate = useCallback((date: Date | string): Date => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  // 시간당 슬롯 수 계산 함수
  const getSlotsPerHour = useCallback((timeInterval: number): number => {
    return 60 / timeInterval;
  }, []);

  // 필터링된 예약실 목록
  const filteredRooms = useMemo(() => {
    if (!hospitalSchedules?.rooms) return [];

    const normalizedCurrentDate = normalizeDate(currentDate);

    // 날짜 범위 체크를 포함한 필터링
    let filtered = hospitalSchedules.rooms.filter((room) => {
      // operationStartDate와 operationEndDate 사이에 있는지 확인
      if (room.operationStartDate) {
        const startDate = normalizeDate(room.operationStartDate);
        if (normalizedCurrentDate < startDate) {
          return false;
        }
      }

      if (room.operationEndDate) {
        const endDate = normalizeDate(room.operationEndDate);
        if (normalizedCurrentDate > endDate) {
          return false;
        }
      }

      return true;
    });

    // filters가 있고 rooms 필터가 있으면 추가 필터링
    if (filters && filters.rooms && filters.rooms.length > 0) {
      filtered = filtered.filter((room) =>
        filters.rooms.includes(room.id.toString())
      );
    }

    return filtered;
  }, [hospitalSchedules, filters, currentDate, normalizeDate]);

  // 모든 예약실의 운영시간을 분석하여 통일된 높이 계산
  const { unifiedSlotHeight, unifiedHourHeight } = useMemo(() => {
    if (!filteredRooms || filteredRooms.length === 0) {
      return {
        unifiedSlotHeight: MIN_HEIGHT,
        unifiedHourHeight: MIN_HEIGHT * 6,
      };
    }

    // 여러 예약실이 있을 때만 통일 계산 필요
    if (filteredRooms.length === 1) {
      return { unifiedSlotHeight: undefined, unifiedHourHeight: undefined };
    }

    // 현재 날짜(요일)에 해당하는 모든 운영시간의 timeSlotDuration 수집
    const dayOfWeek = currentDate.getDay();
    const timeSlotDurations = filteredRooms
      .map((room) => {
        const day = room.weeklySchedule?.current?.days?.find(
          (d) => d.dayOfWeek === dayOfWeek
        );
        return day?.timeSlotDuration || 15; // 기본값 15분
      })
      .filter((duration) => duration > 0);

    if (timeSlotDurations.length === 0) {
      return {
        unifiedSlotHeight: MIN_HEIGHT,
        unifiedHourHeight: MIN_HEIGHT * 6,
      };
    }

    // 평균 timeSlotDuration을 기준으로 높이 계산 (더 안정적)
    const avgTimeSlotDuration =
      timeSlotDurations.reduce((sum, duration) => sum + duration, 0) /
      timeSlotDurations.length;

    // 최소 높이 보장하면서 적절한 비율 유지
    const baseSlotHeight = Math.max(
      MIN_HEIGHT,
      Math.min(MAX_HEIGHT, (avgTimeSlotDuration / 10) * MIN_HEIGHT)
    );
    const baseSlotsPerHour = getSlotsPerHour(avgTimeSlotDuration);
    const baseHourHeight = baseSlotHeight * baseSlotsPerHour;

    return {
      unifiedSlotHeight: baseSlotHeight,
      unifiedHourHeight: baseHourHeight,
    };
  }, [filteredRooms, currentDate, getSlotsPerHour]);

  const parseTimeToMinutes = useCallback((time: string) => {
    const [h, m] = time.split(":");
    const hours = Number(h);
    const minutes = Number(m);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }, []);

  const minutesToTimeString = useCallback((minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, []);

  // 표시 중인 예약실 운영시간 기준으로 시간 라벨 범위 계산
  const { earliestStartTime, latestEndTime } = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    if (!filteredRooms || filteredRooms.length === 0) {
      return { earliestStartTime: "09:00", latestEndTime: "18:00" };
    }

    const todaysRoomOperatingHours = filteredRooms
      .map((room: AppointmentRoom) =>
        room.weeklySchedule?.current?.days?.find((d) => d.dayOfWeek === dayOfWeek)
      )
      .filter(Boolean) as Array<{ startTime?: string; endTime?: string }>;

    const startMinutes = todaysRoomOperatingHours
      .map((oh) => (oh.startTime ? parseTimeToMinutes(oh.startTime) : null))
      .filter((v): v is number => typeof v === "number");
    const endMinutes = todaysRoomOperatingHours
      .map((oh) => (oh.endTime ? parseTimeToMinutes(oh.endTime) : null))
      .filter((v): v is number => typeof v === "number");

    if (startMinutes.length === 0 || endMinutes.length === 0) {
      return { earliestStartTime: "09:00", latestEndTime: "18:00" };
    }

    const earliest = Math.min(...startMinutes);
    const latest = Math.max(...endMinutes);
    return {
      earliestStartTime: minutesToTimeString(earliest),
      latestEndTime: minutesToTimeString(latest),
    };
  }, [currentDate, filteredRooms, minutesToTimeString, parseTimeToMinutes]);

  // 시간 레이블용 시간대 및 높이 계산
  const { timeLabels, timeLabelsHourHeight } = useMemo(() => {
    const startHour = parseInt(earliestStartTime.split(":")[0] || "0");
    const endHour = parseInt(latestEndTime.split(":")[0] || "0");
    const endMinute = parseInt(latestEndTime.split(":")[1] || "0");

    // 종료 시간의 정시까지 라벨 표시
    // 정시 종료: 09:00~18:00 → 09:00~17:00 라벨
    // 분 단위 종료: 09:00~19:30 → 09:00~19:00 라벨 (19:00~19:30 구간 존재)
    const hours = [];
    const labelEndHour = endMinute > 0 ? endHour : endHour - 1;
    for (let h = startHour; h <= labelEndHour; h++) {
      hours.push(h);
    }

    // 시간 레이블의 hourHeight 계산
    let calculatedHourHeight: number;

    if (unifiedHourHeight) {
      // 여러 진료실이 있을 때는 통일된 높이 사용
      calculatedHourHeight = unifiedHourHeight;
    } else if (filteredRooms && filteredRooms.length === 1) {
      // 진료실이 1개일 때는 그 진료실의 실제 높이 계산
      const room = filteredRooms[0];
      const dayOfWeek = currentDate.getDay();
      const roomOH = room?.weeklySchedule?.current?.days?.find(
        (d) => d.dayOfWeek === dayOfWeek
      );
      const timeInterval = roomOH?.timeSlotDuration || 15;

      // daily-time-slot.tsx와 동일한 계산 방식
      const slotHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, (timeInterval / 10) * MIN_HEIGHT)
      );
      const slotsPerHour = getSlotsPerHour(timeInterval);
      calculatedHourHeight = slotHeight * slotsPerHour;
    } else {
      // 기본값 (20px * 6슬롯 = 100px)
      calculatedHourHeight = 120;
    }

    return {
      timeLabels: hours,
      timeLabelsHourHeight: calculatedHourHeight,
    };
  }, [
    earliestStartTime,
    latestEndTime,
    unifiedHourHeight,
    filteredRooms,
    currentDate,
    getSlotsPerHour,
  ]);

  // 개별 예약실에 대한 실제 슬롯 높이 계산
  const getSlotHeightForRoom = useCallback(
    (roomTimeSlotDuration: number): number => {
      if (!unifiedHourHeight || !unifiedSlotHeight) {
        // 단일 룸인 경우 기본 계산
        return Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, (roomTimeSlotDuration / 10) * MIN_HEIGHT)
        );
      }

      // 통일된 시간당 높이를 기준으로 해당 룸의 슬롯 높이 계산
      const slotsPerHour = getSlotsPerHour(roomTimeSlotDuration);
      const calculatedSlotHeight = unifiedHourHeight / slotsPerHour;

      // 최소 높이 보장
      return Math.max(MIN_HEIGHT, calculatedSlotHeight);
    },
    [unifiedHourHeight, unifiedSlotHeight, getSlotsPerHour]
  );

  // 시간 포맷팅 함수
  const formatTimeLabel = useCallback((hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`;
  }, []);

  return {
    filteredRooms,
    unifiedSlotHeight,
    unifiedHourHeight,
    earliestStartTime,
    latestEndTime,
    timeLabels,
    timeLabelsHourHeight,
    getSlotHeightForRoom,
    getSlotsPerHour,
    formatTimeLabel,
  };
}

