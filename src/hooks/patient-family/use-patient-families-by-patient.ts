import { useQuery } from "@tanstack/react-query";
import { PatientFamiliesService } from "@/services/patient-families-service";

export const usePatientFamiliesByPatient = (patientId: number | null) => {
  return useQuery({
    queryKey: ["patient-families", patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("Patient ID is required");
      return PatientFamiliesService.getPatientFamiliesByPatient(patientId);
    },
    enabled: !!patientId && !["undefined", "null"].includes(String(patientId)),
  });
};
