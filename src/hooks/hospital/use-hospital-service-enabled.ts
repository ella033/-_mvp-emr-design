import { HospitalsService } from "@/services/hospitals-service";
import { useQuery } from "@tanstack/react-query";
import type { operations } from "@/generated/api/types";

type ServiceEnabledList =
  operations["HospitalServiceEnabledController_findAll"]["responses"]["200"]["content"]["application/json"];
type ServiceEnabled =
  operations["HospitalServiceEnabledController_findOne"]["responses"]["200"]["content"]["application/json"];

export function useHospitalServiceEnabledList(params?: {
  serviceName?: string;
  enabled?: boolean;
}) {
  return useQuery<ServiceEnabledList>({
    queryKey: ["hospital-service-enabled", "list", params],
    queryFn: async () => {
      return await HospitalsService.getServiceEnabledList(params);
    },
  });
}

export function useHospitalServiceEnabled(serviceName: string | undefined) {
  return useQuery<ServiceEnabled>({
    queryKey: ["hospital-service-enabled", serviceName],
    queryFn: async () => {
      if (!serviceName) throw new Error("Service name is required");
      return await HospitalsService.getServiceEnabled(serviceName);
    },
    enabled: !!serviceName,
  });
}
