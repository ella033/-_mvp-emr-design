import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labManagementApi } from "../api/lab-management.api";
import type { SpecimenQualityGrade } from "../model";

export function useInternalLab() {
  const queryClient = useQueryClient();

  const { data: hospital, isLoading } = useQuery({
    queryKey: ["hospital", 1],
    queryFn: () => labManagementApi.getInternalHospital(1),
  });

  const grades: SpecimenQualityGrade[] = hospital?.internalLabInfo?.specimenQualityGrades || [];
  const currentGrade = hospital?.internalLabInfo?.currentGrade || null;

  const updateGradesMutation = useMutation({
    mutationFn: (data: { specimenQualityGrades: SpecimenQualityGrade[] } | null) =>
      labManagementApi.updateInternalLabInfo(1, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", 1] });
      queryClient.invalidateQueries({ queryKey: ["internal-lab", "grades"] });
    },
  });

  return {
    grades,
    currentGrade,
    isLoading,
    isEnabled: hospital?.internalLabInfo !== null && hospital?.internalLabInfo !== undefined,
    updateGrades: updateGradesMutation,
  };
}
