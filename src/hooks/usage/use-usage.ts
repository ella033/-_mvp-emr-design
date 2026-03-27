import { useQuery } from "@tanstack/react-query";
import { UsageService } from "@/services/usage-service";

export const useUsages = () => {
  return useQuery({
    queryKey: ["usages"],
    queryFn: () => UsageService.getUsages(),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
