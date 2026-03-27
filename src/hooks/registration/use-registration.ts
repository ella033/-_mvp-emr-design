import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";

export function useRegistration(id: string) {
  return useQuery({
    queryKey: ["registration", id],
    queryFn: async () => {
      return await RegistrationsService.getRegistration(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id), // registrationId가 있을 때만 쿼리 실행
  });
}
