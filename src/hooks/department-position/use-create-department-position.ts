import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DepartmentPositionService } from "@/services/department-position-service";
import { DepartmentPositionType } from "@/types/department-position-types";

export function useCreateDepartmentPosition(options?: {
  onSuccess?: (data: DepartmentPositionType) => void;
  onError?: (error: any) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return await DepartmentPositionService.createPosition(data);
    },
    onSuccess: (newPosition) => {
      queryClient.invalidateQueries({ queryKey: ["departmentsWithPositions", newPosition.departmentId] });
    },
    ...options,
  });
}
