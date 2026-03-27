import { useMutation } from "@tanstack/react-query";
import { VitalSignMeasurementsService } from "@/services/vital-sign-measurements-service";
import { formatDateByPattern } from "@/lib/date-utils";
import type {
  DeleteUpsertManyVitalSignMeasurementsRequest,
  DeleteUpsertManyVitalSignMeasurementsResponse,
} from "@/types/vital/vital-sign-measurement-types";

export function useDeleteUpsertManyVitalSignMeasurements(options?: {
  onSuccess?: (data: DeleteUpsertManyVitalSignMeasurementsResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({
      patientId,
      beginDate,
      endDate,
      vitalSignMeasurements,
    }: {
      patientId: number;
      beginDate?: string;
      endDate?: string;
      vitalSignMeasurements: DeleteUpsertManyVitalSignMeasurementsRequest;
    }) => {
      const begin = beginDate ?? formatDateByPattern(new Date(), "YYYY-MM-DD");
      const end = endDate ?? formatDateByPattern(new Date(), "YYYY-MM-DD");

      return VitalSignMeasurementsService.deleteUpsertManyVitalSignMeasurements(
        patientId,
        begin,
        end,
        vitalSignMeasurements
      );
    },
    ...options,
  });
}
