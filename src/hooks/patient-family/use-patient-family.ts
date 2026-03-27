import { useQuery } from "@tanstack/react-query";
import { PatientFamiliesService } from "@/services/patient-families-service";
export const usePatientFamily = (id: number) => {
  return useQuery({
    queryKey: ["patient-family", id],
    queryFn: async () => {
      return PatientFamiliesService.getPatientFamily(id);
    },
    enabled: !!id && typeof id === "number" && id > 0,
  });
};
