import { HospitalsService } from "@/services/hospitals-service";
import { useQuery } from "@tanstack/react-query";

export function useHospitals() {
  return useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      return await HospitalsService.getHospitals();
    },
  });
}
