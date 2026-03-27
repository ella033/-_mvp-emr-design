import { useMutation } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";

export type PatientCheckRrnResponse = { duplicate: boolean };
export type PatientCheckRrnVariables = { rrn: string; excludePatientId?: number };

export function usePatientCheckRrn() {
  return useMutation<PatientCheckRrnResponse, unknown, PatientCheckRrnVariables>({
    mutationFn: async (variables) => {
      return PatientsService.checkPatientRrnDuplicate(
        variables.rrn,
        variables.excludePatientId
      );
    },
  });
}