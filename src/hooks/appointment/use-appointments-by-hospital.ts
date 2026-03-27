import { useQuery } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type { Appointment } from "@/types/appointments/appointments";

export function useAppointmentsByHospital(
  hospitalId: number | undefined,
  beginDate?: Date | null,
  endDate?: Date | null
) {
  // queryKey에 Date 객체 대신 ISO 문자열 사용 (무한 루프 방지)
  const beginKey = beginDate ? beginDate.toISOString() : null;
  const endKey = endDate ? endDate.toISOString() : null;

  return useQuery({
    queryKey: ["appointments", "hospital", hospitalId, beginKey, endKey],
    queryFn: async (): Promise<Appointment[]> => {
      if (!hospitalId) throw new Error("Hospital ID is required");
      // 날짜가 없으면 오늘 하루로 설정
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // 전달받은 날짜에 대해서도 시작/끝 시간 설정
      // 원본 Date 객체를 수정하지 않도록 복사본 사용
      const beginDateStr = beginDate
        ? (() => {
          const dateCopy = new Date(beginDate);
          dateCopy.setHours(0, 0, 0, 0);
          return dateCopy.toISOString();
        })()
        : startOfDay.toISOString();
      const endDateStr = endDate
        ? (() => {
          const dateCopy = new Date(endDate);
          dateCopy.setHours(23, 59, 59, 999);
          return dateCopy.toISOString();
        })()
        : endOfDay.toISOString();

      return AppointmentsService.getAppointmentsByHospital(
        hospitalId,
        beginDateStr,
        endDateStr
      );
    },
    enabled: !!hospitalId && typeof hospitalId === "number" && hospitalId > 0, // hospitalId가 있을 때만 쿼리 실행
  });
}
