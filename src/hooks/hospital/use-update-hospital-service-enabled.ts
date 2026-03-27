import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HospitalsService } from "@/services/hospitals-service";
import type { components, operations } from "@/generated/api/types";

type CreateServiceEnabledResponse =
  operations["HospitalServiceEnabledController_create"]["responses"]["201"]["content"]["application/json"];

export function useCreateHospitalServiceEnabled(options?: {
  onSuccess?: (data: CreateServiceEnabledResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: components["schemas"]["CreateHospitalServiceEnabledDto"]
    ) => HospitalsService.createServiceEnabled(data),
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["hospital-service-enabled", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["hospital-service-enabled", data.serviceName],
      });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

export function useDeleteHospitalServiceEnabled(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceName: string) =>
      HospitalsService.deleteServiceEnabled(serviceName),
    onSuccess: (_, serviceName) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["hospital-service-enabled", serviceName],
      });
      queryClient.invalidateQueries({
        queryKey: ["hospital-service-enabled", "list"],
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
