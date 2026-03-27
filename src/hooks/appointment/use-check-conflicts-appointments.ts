import { useMutation } from "@tanstack/react-query";
import { AppointmentsService } from "@/services/appointments-service";
import type {
  CheckHolidayConflictsRequest,
  CheckHolidayConflictsResponse,
} from "@/types/common/holiday-applications-types";

export function useCheckHolidayConflicts(options?: {
  onSuccess?: (data: CheckHolidayConflictsResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation<CheckHolidayConflictsResponse, Error, CheckHolidayConflictsRequest>({
    mutationFn: async (data: CheckHolidayConflictsRequest) => {
      return await AppointmentsService.checkHolidayConfilicts(data);
    },
    ...options,
  });
}

export function useCheckOperatingHoursConflicts(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: any) => {
      return await AppointmentsService.checkOperatingHoursConfilicts(data);
    },
    ...options,
  });
}