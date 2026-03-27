import { useMutation } from "@tanstack/react-query";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import type {
  DeleteVitalSignMeasurementResponse,
  DeleteVitalSignMeasurementsByMeasurementDateTimeRequest,
} from "@/types/vital/vital-sign-measurement-types";

export const useDeleteVitalSignMeasurement = (options?: {
  onSuccess?: (data: DeleteVitalSignMeasurementResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: string) =>
      VitalSignMeasurementsService.deleteVitalSignMeasurement(id),
    ...options,
  });
};

export const useDeleteVitalSignMeasurementsByMeasurementDateTime = (options?: {
  patientId: number;
  measurementDateTimes: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: number;
      data: DeleteVitalSignMeasurementsByMeasurementDateTimeRequest;
    }) =>
      VitalSignMeasurementsService.deleteVitalSignMeasurementsByMeasurementDateTime(
        patientId,
        { measurementDateTimes: data.measurementDateTimes }
      ),
    ...options,
  });
};
