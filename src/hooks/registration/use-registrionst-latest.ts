import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import { registrationKeys } from "@/lib/query-keys/registrations";

export function useRegistrationsLatest(patientId: string, baseDate?: string) {
  return useQuery({
    queryKey: registrationKeys.latest(patientId, baseDate),
    queryFn: () => RegistrationsService.getLatestRegistration(patientId, baseDate),
    enabled: !!patientId && patientId !== "", // patientId가 있을 때만 쿼리 실행
  });
}