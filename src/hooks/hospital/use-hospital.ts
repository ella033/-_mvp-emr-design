import { HospitalsService } from "@/services/hospitals-service";
import { useQuery } from "@tanstack/react-query";

export function useHospital(id: number | undefined) {
  return useQuery({
    queryKey: ["hospital", id],
    queryFn: async () => {
      if (!id) throw new Error("Hospital ID is required");
      return await HospitalsService.getHospital(id);
    },
    enabled: !!id && typeof id === "number" && id > 0, // hospitalId가 유효한 숫자일 때만 쿼리 실행
  });
}
