import { useMutation } from "@tanstack/react-query";
import { DepartmentPositionService } from "@/services/department-position-service";
import { DepartmentPositionUpdateRequestType } from "@/types/department-position-types";

export function useUpdateDepartmentPosition(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & DepartmentPositionUpdateRequestType) => {
      return await DepartmentPositionService.updatePosition(id, data);
    },
    ...options,
  });
}
