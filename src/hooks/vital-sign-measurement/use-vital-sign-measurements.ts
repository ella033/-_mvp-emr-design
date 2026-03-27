import { useQuery } from "@tanstack/react-query";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import type {
  VitalSignMeasurement,
  VitalSignMeasurementPivotResponse,
} from "@/types/vital/vital-sign-measurement-types";

export const useVitalSignMeasurements = (
  patientId: number,
  beginDate?: string,
  endDate?: string,
  itemId?: number
) => {
  return useQuery<VitalSignMeasurement[]>({
    queryKey: [
      "vital-sign-measurements",
      patientId,
      beginDate,
      endDate,
      itemId,
    ],
    queryFn: async () => {
      return VitalSignMeasurementsService.getVitalSignMeasurements(
        patientId,
        beginDate,
        endDate,
        itemId
      );
    },
    enabled: !!patientId && typeof patientId === "number" && patientId > 0,
  });
};

export const useVitalSignMeasurementsPivot = (
  patientId: number,
  beginDate?: string,
  endDate?: string
) => {
  return useQuery<VitalSignMeasurementPivotResponse>({
    queryKey: [
      "vital-sign-measurements",
      "pivot",
      patientId,
      beginDate,
      endDate,
    ],
    queryFn: async () => {
      return VitalSignMeasurementsService.getVitalSignMeasurementsPivot(
        patientId,
        beginDate,
        endDate
      );
    },
    enabled: !!patientId && typeof patientId === "number" && patientId > 0,
  });
};
