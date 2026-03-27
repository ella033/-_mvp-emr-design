import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import type { RegistrationListOptions } from "@/lib/api/routes/registrations-api";
import type { Registration } from "@/types/registration-types";
import { registrationKeys } from "@/lib/query-keys/registrations";

export function useRegistrationsByHospital(
  hospitalId: string,
  beginDate?: Date | null,
  endDate?: Date | null,
  options?: RegistrationListOptions
) {
  const beginKey = beginDate ? beginDate.toISOString() : null;
  const endKey = endDate ? endDate.toISOString() : null;

  return useQuery({
    queryKey: registrationKeys.byHospital(hospitalId, beginKey, endKey, options?.examHas),
    queryFn: async (): Promise<Registration[]> => {
      const today = new Date();
      const defaultStart = new Date(today);
      defaultStart.setHours(0, 0, 0, 0);
      const defaultEnd = new Date(today);
      defaultEnd.setHours(23, 59, 59, 999);

      // 원본 Date 객체를 수정하지 않도록 복사본 사용
      const beginTarget = beginDate ? new Date(beginDate) : defaultStart;
      beginTarget.setHours(0, 0, 0, 0);

      const endTarget = endDate ? new Date(endDate) : defaultEnd;
      endTarget.setHours(23, 59, 59, 999);

      return RegistrationsService.getRegistrationsByHospital(
        hospitalId,
        beginTarget.toISOString(),
        endTarget.toISOString(),
        options
      );
    },
    enabled: !!hospitalId && !["undefined", "null"].includes(hospitalId), // hospitalId가 있을 때만 쿼리 실행
    staleTime: 30_000, // 드래그 등 빈번한 리렌더 시 불필요한 refetch 방지
  });
}
