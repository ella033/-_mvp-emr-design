import { useQuery } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";

export function useMedicalAidList(patientId: string) {
  return useQuery({
    queryKey: ["medical-aid-list", patientId],
    queryFn: () => PatientsService.getMedicalAidList(patientId),
  });
}
