import type {
  AppointmentRoom,
  HospitalSchedule,
  OperatingHours,
  SlotClosure,
  HospitalHolidayTypes,
} from "@/types/calendar-types";
import {
  findHospitalHolidayInfoFromDate,
  isHospitalHolidayDate,
} from "@/lib/holiday-utils";

export const useTimeSlot = (
  appointmentRoom: AppointmentRoom,
  hospitalSchedules?: HospitalSchedule | null
) => {
  const makeStableNumericId = (seed: string): number => {
    // 간단한 안정 해시(djb2 변형) → 32-bit 양수로 변환
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 33) ^ seed.charCodeAt(i);
    }
    return (hash >>> 0) || 1;
  };

  const parseTimeToMinutes = (time: string): number | null => {
    const [h, m] = time.split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  };

  const minutesToTimeString = (minutes: number): string => {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  /**
   * hospitalSchedules에서 hospitalOperatingHours가 더 이상 내려오지 않는다고 가정한다.
   * 대신 rooms[*].weeklySchedule.current.days를 취합해서 병원 기준 운영시간을 만든다.
   * - dayOfWeek별 가장 이른 startTime / 가장 늦은 endTime
   * - timeSlotDuration은 가장 작은 단위를 사용(없으면 15)
   */
  const maxHospitalOperatingHours: OperatingHours[] = (() => {
    const rooms = (hospitalSchedules as any)?.rooms ?? [];
    if (!Array.isArray(rooms) || rooms.length === 0) return [];

    const byDow = new Map<
      number,
      { startMin: number; endMin: number; minDuration: number }
    >();

    for (const room of rooms) {
      const days = room?.weeklySchedule?.current?.days ?? [];
      if (!Array.isArray(days)) continue;

      for (const d of days) {
        const dow = Number(d?.dayOfWeek);
        const startMin = typeof d?.startTime === "string" ? parseTimeToMinutes(d.startTime) : null;
        const endMin = typeof d?.endTime === "string" ? parseTimeToMinutes(d.endTime) : null;
        if (startMin == null || endMin == null || Number.isNaN(dow)) continue;

        const duration = Number(d?.timeSlotDuration);
        const durationMin = Number.isFinite(duration) && duration > 0 ? duration : 15;

        const prev = byDow.get(dow);
        if (!prev) {
          byDow.set(dow, { startMin, endMin, minDuration: durationMin });
        } else {
          byDow.set(dow, {
            startMin: Math.min(prev.startMin, startMin),
            endMin: Math.max(prev.endMin, endMin),
            minDuration: Math.min(prev.minDuration, durationMin),
          });
        }
      }
    }
    return Array.from(byDow.entries())
      .sort(([a], [b]) => a - b)
      .map(([dayOfWeek, v]) => ({
        dayOfWeek,
        startTime: minutesToTimeString(v.startMin),
        endTime: minutesToTimeString(v.endMin),
        timeSlotDuration: v.minDuration,
        isActive: true,
        breakTimes: [],
      }));
  })();

  // hospitalSchedules.hospitalHolidays만 사용
  const hospitalHolidays: HospitalHolidayTypes[] =
    ((hospitalSchedules as any)?.hospitalHolidays as any) ?? [];

  const toKstYmd = (value: Date | string | null | undefined): string => {
    if (!value) return "";
    const d = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  const isYmdInRange = (target: string, from: string, to: string): boolean => {
    if (!target || !from || !to) return false;
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;
    return target >= start && target <= end;
  };

  const isWithinEffectiveRange = (
    targetYmd: string,
    effectiveFrom?: string | null,
    effectiveTo?: string | null
  ): boolean => {
    const from = String(effectiveFrom ?? "").trim();
    const to = String(effectiveTo ?? "").trim();
    if (!targetYmd || !from) return false;
    if (!to) return targetYmd >= from; // open-ended
    return isYmdInRange(targetYmd, from, to);
  };

  /**
   * hospitalSchedules.hospitalBreakTimes에서 "해당 date에 유효한" 병원 휴게시간을 반환한다.
   * - breakTimes는 dayOfWeek로 필터링하여 반환
   */
  const getHospitalBreakTimes = (date: Date) => {
    const targetYmd = toKstYmd(date);
    const dayOfWeek = date.getDay();

    const schedule = (hospitalSchedules as any)?.hospitalBreakTimes;
    if (!schedule || !targetYmd) return [];

    const mapBreakTimes = (items: any[]) => {
      if (!Array.isArray(items)) return [];
      return items
        .filter((it) => Number(it?.dayOfWeek) === dayOfWeek)
        .sort((a, b) => Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0))
        .map((it, idx) => {
          const breakStart = String(it?.breakStart ?? "");
          const breakEnd = String(it?.breakEnd ?? "");
          const sortOrder = Number.isFinite(Number(it?.sortOrder))
            ? Number(it?.sortOrder)
            : idx;
          const breakName =
            typeof it?.breakName === "string" ? it.breakName : "";

          return {
            id: makeStableNumericId(
              `hospital-break:${targetYmd}:${dayOfWeek}:${breakStart}:${breakEnd}:${sortOrder}`
            ),
            operatingHoursId: 0,
            breakStart,
            breakEnd,
            breakName,
            sortOrder,
            isActive: true,
          };
        });
    };

    const current = schedule.current;
    if (current && Array.isArray(current.breakTimes)) {
      if (
        isWithinEffectiveRange(
          targetYmd,
          current?.effectiveFrom,
          current?.effectiveTo
        )
      ) {
        return mapBreakTimes(current.breakTimes);
      }
    }

    const history = Array.isArray(schedule.history) ? schedule.history : [];
    const matchedHistory = history.find((h: any) =>
      isWithinEffectiveRange(targetYmd, h?.effectiveFrom, h?.effectiveTo)
    );
    if (matchedHistory && Array.isArray(matchedHistory.breakTimes)) {
      return mapBreakTimes(matchedHistory.breakTimes);
    }

    // 마지막 fallback: current (effectiveFrom 이후 적용 가정)
    if (current && Array.isArray(current.breakTimes)) {
      const from = String(current?.effectiveFrom ?? "").trim();
      if (!from || targetYmd >= from) return mapBreakTimes(current.breakTimes);
    }

    return [];
  };

  /**
   * daily view 등에서 "현재 appointmentRoomId"에 해당하는 최신 weeklySchedule을 사용해야 한다.
   * - appointmentRoom param이 비어있거나 부분 객체일 수 있으므로(hospitalSchedules 기반으로 렌더링하는 경우),
   *   hospitalSchedules.rooms에서 id로 다시 찾아서 사용한다.
   */
  const getResolvedRoom = (): AppointmentRoom | null => {
    const roomId = (appointmentRoom as any)?.id;
    if (typeof roomId !== "number") return null;

    const rooms = (hospitalSchedules as any)?.rooms;
    if (Array.isArray(rooms)) {
      const found = rooms.find((r: any) => r?.id === roomId);
      if (found) return found as AppointmentRoom;
    }
    return appointmentRoom ?? null;
  };

  const getRoomWeekScheduleForDate = (date: Date) => {
    const targetYmd = toKstYmd(date);
    const resolvedRoom = getResolvedRoom();
    const schedule = (resolvedRoom as any)?.weeklySchedule;
    if (!schedule || !targetYmd) return null;

    // 1) current가 "effectiveFrom~effectiveTo" 기간을 갖는 경우: 해당 기간에 포함될 때만 사용
    const current = schedule.current;
    if (current && Array.isArray(current.days)) {
      const currentFrom = current?.effectiveFrom;
      const currentTo = current?.effectiveTo; // 일부 API에서 내려올 수 있음
      if (isWithinEffectiveRange(targetYmd, currentFrom, currentTo)) {
        return current;
      }
    }

    // 2) history에서 조회 날짜가 속하는 기간을 찾는다 (effectiveTo가 없으면 open-ended로 취급)
    const history = Array.isArray(schedule.history) ? schedule.history : [];
    const matchedHistory = history.find((h: any) =>
      isWithinEffectiveRange(targetYmd, h?.effectiveFrom, h?.effectiveTo)
    );
    if (matchedHistory && Array.isArray(matchedHistory.days)) return matchedHistory;

    // 3) 마지막 fallback: current (effectiveFrom 이후 적용 가정)
    if (current && Array.isArray(current.days)) {
      const from = String(current.effectiveFrom ?? "");
      if (!from || targetYmd >= from) return current;
    }

    return current ?? null;
  };

  const getRoomDaySchedule = (date: Date) => {
    const week = getRoomWeekScheduleForDate(date);
    const days = (week as any)?.days ?? [];
    if (!Array.isArray(days)) return null;
    const dow = date.getDay();
    return days.find((d: any) => Number(d?.dayOfWeek) === dow) ?? null;
  };

  // 현재 날짜에 해당하는 운영시간 가져오기
  const getCurrentOperatingHours = (
    date: Date,
    isDailyview: boolean = true
  ): OperatingHours | null => {
    if (isDailyview) {
      const daySchedule = getRoomDaySchedule(date);
      if (!daySchedule) return null;
      const breakTimes = getHospitalBreakTimes(date);
      return {
        dayOfWeek: date.getDay(),
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
        timeSlotDuration: daySchedule.timeSlotDuration,
        isActive: true,
        breakTimes,
      };
    } else {
      // weekly view: "해당 date가 포함된 주간(7일)"의 운영시간들 중
      // 가장 빠른 시작/가장 늦은 종료를 사용해 주간 그리드 범위를 잡는다.
      // (운영시간은 dayOfWeek 기반 반복 스케줄이므로, 실질적으로는 활성화된 운영시간 전체를 대상으로 계산)
      const dayOfWeek = date.getDay();
      const week = getRoomWeekScheduleForDate(date);
      const activeOperatingHours =
        Array.isArray((week as any)?.days) ? (week as any).days : [];

      if (activeOperatingHours.length === 0) return null;

      const startMinutes = activeOperatingHours
        .map((oh: any) => (oh.startTime ? parseTimeToMinutes(oh.startTime) : null))
        .filter((v: unknown): v is number => typeof v === "number");
      const endMinutes = activeOperatingHours
        .map((oh: any) => (oh.endTime ? parseTimeToMinutes(oh.endTime) : null))
        .filter((v: unknown): v is number => typeof v === "number");

      if (startMinutes.length === 0 || endMinutes.length === 0) return null;

      const earliestStart = Math.min(...startMinutes);
      const latestEnd = Math.max(...endMinutes);

      // timeSlotDuration은 가장 작은 단위를 선택(없으면 15분)
      const durations = activeOperatingHours
        .map((oh: any) => oh.timeSlotDuration)
        .filter((d: unknown): d is number => typeof d === "number" && d > 0);
      const timeSlotDuration =
        durations.length > 0 ? Math.min(...durations) : 15;

      // breakTimes는 hospitalSchedules.hospitalBreakTimes 기준으로 사용
      const breakTimes = getHospitalBreakTimes(date);

      return {
        dayOfWeek,
        startTime: minutesToTimeString(earliestStart),
        endTime: minutesToTimeString(latestEnd),
        timeSlotDuration,
        isActive: true,
        breakTimes,
      };
    }
  };

  // =========================================================================
  // 모든 예약실의 가장 빠른 시작시간, 가장 늦은 종료시간을 취합해서 maxHospitalOperatingHours를 만든다. 
  // =========================================================================
  const getHospitalOperatingHours = (date: Date): OperatingHours | null => {
    const dayOfWeek = date.getDay();
    const base =
      maxHospitalOperatingHours?.find(
        (oh) => oh.dayOfWeek === dayOfWeek && oh.isActive
      ) || null;
    if (!base) return null;

    return {
      ...base,
      breakTimes: getHospitalBreakTimes(date),
    };
  };

  const toLocalDayStart = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  };

  const toLocalDayEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  };

  // =========================================================================
  // 현재 날짜가 휴무일인지 확인 (병원 전체 휴무일만 사용)
  // =========================================================================
  const isHoliday = (date: Date): boolean => {
    return isHospitalHolidayDate(hospitalHolidays, date);
  };

  // 화면 표시용(이름/종류) 정보가 필요한 경우에만 사용
  const getHoliday = (date: Date): HospitalHolidayTypes | null => {
    const hospitalHoliday = findHospitalHolidayInfoFromDate(hospitalHolidays, date);
    if (!hospitalHoliday) return null;
    return {
      id: hospitalHoliday.id,
      holidayName: hospitalHoliday.holidayName,
      startDate: toLocalDayStart(date),
      endDate: toLocalDayEnd(date),
    };
  };

  // 현재 날짜의 마감시간 가져오기
  const getCurrentClosures = (date: Date): SlotClosure[] => {
    return (
      appointmentRoom.slotClosures?.filter((sc) => {
        const closureDate =
          typeof sc.closureDate === "string"
            ? new Date(sc.closureDate)
            : sc.closureDate;

        const closureDateOnly = new Date(
          closureDate.getFullYear(),
          closureDate.getMonth(),
          closureDate.getDate()
        );
        const targetDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        return closureDateOnly.getTime() === targetDate.getTime();
      }) || []
    );
  };

  // 특정 시간대가 예약 가능한지 확인
  const isTimeSlotAvailable = (
    date: Date,
    hour: number,
    minute: number
  ): boolean => {
    if (isHoliday(date)) return false;

    const currentOH = getCurrentOperatingHours(date);
    const currentHospitalOH = getHospitalOperatingHours(date);
    if (!currentOH && !currentHospitalOH) return false;

    const currentClosures = getCurrentClosures(date);
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    // 운영시간 내인지 확인
    if (
      currentOH &&
      (timeString < currentOH.startTime || timeString >= currentOH.endTime)
    ) {
      return false;
    }

    // 병원 휴게시간인지 확인
    if (
      currentHospitalOH?.breakTimes &&
      currentHospitalOH.breakTimes.length > 0
    ) {
      for (const breakTime of currentHospitalOH.breakTimes) {
        if (
          timeString >= breakTime.breakStart &&
          timeString < breakTime.breakEnd
        ) {
          return false;
        }
      }
    }

    // 마감시간인지 확인
    for (const closure of currentClosures) {
      if (timeString >= closure.startTime && timeString < closure.endTime) {
        return false;
      }
    }

    return true;
  };

  // 특정 시간대가 휴게시간인지 확인
  const isBreakTime = (
    date: Date,
    hour: number,
    minute: number
  ): { isBreak: boolean; breakTime?: any } => {
    const currentOH = getCurrentOperatingHours(date);
    if (!currentOH || !currentOH.breakTimes) return { isBreak: false };

    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    for (const breakTime of currentOH.breakTimes) {
      if (
        timeString >= breakTime.breakStart &&
        timeString < breakTime.breakEnd
      ) {
        return { isBreak: true, breakTime };
      }
    }

    return { isBreak: false };
  };

  // 특정 시간대가 마감시간인지 확인
  const isClosureTime = (
    date: Date,
    hour: number,
    minute: number
  ): { isClosure: boolean; closure?: SlotClosure } => {
    const currentClosures = getCurrentClosures(date);
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    for (const closure of currentClosures) {
      if (timeString >= closure.startTime && timeString < closure.endTime) {
        return { isClosure: true, closure };
      }
    }

    return { isClosure: false };
  };

  return {
    getCurrentOperatingHours,
    getHospitalOperatingHours,
    getHospitalBreakTimes,
    isHoliday, // boolean
    getHoliday, // Holiday | null
    getCurrentClosures,
    isTimeSlotAvailable,
    isBreakTime,
    isClosureTime,
    hospitalHolidays, // 병원 전체 휴무일 데이터도 반환(정리된 리스트)
  };
};
