import { useQuery } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";

export const useRegistrationCharts = (id: string | null) => {
  return useQuery({
    queryKey: ["registrations", id, "charts"],
    queryFn: async () => {
      if (!id) throw new Error("Registration ID is required");
      return RegistrationsService.getRegistrationCharts(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id), // id가 있을 때만 쿼리 실행
    refetchOnWindowFocus: false,
  });
};
