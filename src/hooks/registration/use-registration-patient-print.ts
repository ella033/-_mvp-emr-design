import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";

export function useRegistrationPatientPrint(patientId: string, beginDate: string, endDate: string) {
  return useQuery({
    queryKey: ["registration-patient-print", patientId, beginDate, endDate],
    queryFn: () => RegistrationsService.getRegistrationPatientPrintAvailability(patientId, beginDate, endDate),
    enabled: !!patientId && patientId !== "" && !!beginDate && beginDate !== "" && !!endDate && endDate !== "",
  });
}