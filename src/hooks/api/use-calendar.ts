import { CalendarService } from "@/services/calendar-service";
import { useQuery } from "@tanstack/react-query";
import type { HospitalSchedule } from "@/types/calendar-types";

// 병원 스케줄 조회 (복잡한 파라미터가 필요하므로 별도 구현)
export function useHospitalSchedule(year?: string, month?: string) {
  return useQuery<HospitalSchedule>({
    queryKey: ["calendar", "hospital-schedule", year, month],
    queryFn: async () => {
      return await CalendarService.getHospitalSchedule(year, month);
    },
    enabled: true, // 항상 활성화 (year, month가 없어도 현재 날짜로 조회)
  });
}
