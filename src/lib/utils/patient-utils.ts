import { QueryClient } from "@tanstack/react-query";
import type { Registration } from "@/types/registration-types";
import type { Patient } from "@/types/patient-types";

export function getPatientNameFromCache(
  patientId: number,
  queryClient: QueryClient,
  currentRegistration?: Registration | null
): string {
  // 1. 현재 접수 정보에서 확인
  if (
    currentRegistration?.patientId === patientId &&
    currentRegistration?.patient?.name
  ) {
    return currentRegistration.patient.name;
  }

  // 2. React Query 캐시에서 확인
  const cachedPatient = queryClient.getQueryData<Patient>([
    "patient",
    patientId,
  ]);
  
  return cachedPatient?.name || "Unknown";
}
