import { useMutation } from "@tanstack/react-query";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import type {
  CreateVitalSignMeasurementRequest,
  CreateVitalSignMeasurementResponse,
} from "@/types/vital/vital-sign-measurement-types";

export function useCreateVitalSignMeasurement(options?: {
  onSuccess?: (data: CreateVitalSignMeasurementResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (measurement: CreateVitalSignMeasurementRequest) =>
      VitalSignMeasurementsService.createVitalSignMeasurement(measurement),
    ...options,
  });
}
