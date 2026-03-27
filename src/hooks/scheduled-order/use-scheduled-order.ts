import { useQuery } from "@tanstack/react-query";
import { ScheduledOrderService } from "@/services/scheduled-order-service";

// 예약 처방 상세 조회
export const useScheduledOrder = (id: number, baseDate: string) => {
  return useQuery({
    queryKey: ["scheduled-orders", id, baseDate],
    queryFn: () => ScheduledOrderService.getScheduledOrder(id, baseDate),
    enabled: !!id && !!baseDate,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// 환자별 예약 처방 목록 조회
export const useScheduledOrdersByPatient = (
  patientId: number,
  baseDate: string
) => {
  return useQuery({
    queryKey: ["scheduled-orders", "patient", patientId, baseDate],
    queryFn: () =>
      ScheduledOrderService.getScheduledOrdersByPatient(patientId, baseDate),
    enabled: !!patientId && !!baseDate,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) =>
      [...data].sort((a, b) => {
        // applyDate가 없으면 맨 위로
        if (!a.applyDate && !b.applyDate) return 0;
        if (!a.applyDate) return -1;
        if (!b.applyDate) return 1;
        // 오름차순 정렬 (과거 날짜가 위로)
        return a.applyDate.localeCompare(b.applyDate);
      }),
  });
};
