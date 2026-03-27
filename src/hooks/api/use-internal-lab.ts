import { useQuery } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import { createMutationHook } from "@/hooks/common/use-query-factory";
import type { SpecimenQualityGrade } from "@/types/hospital-types";

// 원내 질가산등급 목록 조회 (hospital ID 1 사용)
export function useInternalLabGrades() {
  const { data: hospital, isLoading, ...rest } = useQuery({
    queryKey: ["hospital", 1],
    queryFn: async () => {
      return await HospitalsService.getHospital(1);
    },
  });

  const grades: SpecimenQualityGrade[] = hospital?.internalLabInfo?.specimenQualityGrades || [];
  const currentGrade = hospital?.internalLabInfo?.currentGrade || null;

  return {
    data: grades,
    currentGrade,
    isLoading,
    isEnabled: hospital?.internalLabInfo !== null && hospital?.internalLabInfo !== undefined,
    ...rest,
  };
}

// 원내 질가산등급 전체 업데이트 뮤테이션 (전체 배열을 PUT)
export const useUpdateInternalLabGrades = createMutationHook(
  async (data: { specimenQualityGrades: SpecimenQualityGrade[] } | null) => {
    return await HospitalsService.updateInternalLabInfo(1, data);
  },
  {
    invalidateQueries: [
      ["hospital", 1],
      ["internal-lab", "grades"],
    ],
  }
);
