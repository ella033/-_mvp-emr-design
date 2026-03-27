"use client";

import { useQuery } from "@tanstack/react-query";
import { HolidayApplicationsService } from "@/services/holiday-applications-service";
import { HolidayMastersService } from "@/services/holiday-masters-service";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import { getHolidayQueryRangeRelativeToYear } from "@/lib/holiday-utils";

const HOLIDAY_STALE_TIME_MS = 5 * 60 * 1000; // 5분

function normalizeHolidayApplications(
  holidayApplications: HolidayApplicationTypes[] | null | undefined
): HolidayApplicationTypes[] {
  if (!holidayApplications || holidayApplications.length === 0) return [];

  return holidayApplications.flatMap((application) => {
    const holidayInstances = (application as any).holidayMaster?.holidayInstances;

    if (holidayInstances && holidayInstances.length > 0) {
      return holidayInstances.map(
        (instance: any, index: number) =>
          ({
            ...application,
            id: application.id + index * 10000,
            startDate: instance.startDate || application.startDate,
            endDate: instance.endDate || application.endDate,
            holidayName: application.holidayName,
          }) as HolidayApplicationTypes
      );
    }

    return [application];
  });
}

async function fetchHospitalHolidaysForRange(params: {
  startDate: string;
  endDate: string;
}): Promise<HolidayApplicationTypes[]> {
  const holidayApplications =
    await HolidayApplicationsService.getHolidayApplications(params);

  if (holidayApplications && holidayApplications.length > 0) {
    return normalizeHolidayApplications(holidayApplications);
  }

  // HolidayApplications가 없다면 HolidayMasters 조회 (기존 로직 유지)
  const holidayMasters = await HolidayMastersService.getHolidayMasters();
  return holidayMasters.map((master) => ({
    id: -master.id, // 임시 ID
    hospitalId: 0,
    appointmentRoomId: null,
    holidayMasterId: master.id,
    startDate: master.holidayInstances[0]?.startDate || null,
    endDate: master.holidayInstances[0]?.endDate || null,
    holidayName: master.holidayName,
    isRecurring: master.isRecurring,
    isActive: true,
  })) as HolidayApplicationTypes[];
}

export function useHospitalHolidays(options?: {
  baseYear?: number;
  startOffset?: number;
  endOffset?: number;
  enabled?: boolean;
}) {
  const baseYear = options?.baseYear ?? new Date().getFullYear();
  const startOffset = options?.startOffset ?? 0;
  const endOffset = options?.endOffset ?? 0;
  const enabled = options?.enabled ?? true;

  const range = getHolidayQueryRangeRelativeToYear(baseYear, startOffset, endOffset);

  return useQuery<HolidayApplicationTypes[]>({
    queryKey: ["holidays", "hospital", range.startDate, range.endDate],
    queryFn: async () => fetchHospitalHolidaysForRange(range),
    enabled,
    staleTime: HOLIDAY_STALE_TIME_MS,
  });
}


