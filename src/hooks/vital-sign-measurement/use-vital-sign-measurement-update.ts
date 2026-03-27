import { useMutation } from "@tanstack/react-query";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import type {
  UpdateVitalSignMeasurementRequest,
  UpdateVitalSignMeasurementResponse,
} from "@/types/vital/vital-sign-measurement-types";

export function useUpdateVitalSignMeasurement(options?: {
  onSuccess?: (data: UpdateVitalSignMeasurementResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVitalSignMeasurementRequest;
    }) => VitalSignMeasurementsService.updateVitalSignMeasurement(id, data),
    ...options,
  });
}
