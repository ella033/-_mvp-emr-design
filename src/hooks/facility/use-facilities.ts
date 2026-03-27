import { useQuery } from "@tanstack/react-query";
import { FacilityService } from "@/services/facility-service";

export function useFacilities(queryString: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["facilities", queryString],
    queryFn: async () => {
      return await FacilityService.getFacilities(queryString);
    },
    enabled: enabled && !!queryString,
  });
} 