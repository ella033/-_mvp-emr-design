import { useMutation } from "@tanstack/react-query";
import { DepartmentPositionService } from "@/services/department-position-service";

export function useDeleteDepartmentPosition(options?: {
  onSuccess?: (data: string) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async (positionId: string) => {
      await DepartmentPositionService.deletePosition(positionId);
      return positionId;
    },

    ...options,
  });
}
