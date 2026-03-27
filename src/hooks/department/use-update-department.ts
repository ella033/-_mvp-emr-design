import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DepartmentService } from "@/services/department-service";
import { DepartmentUpdateRequestType } from "@/types/department-types";

export function useUpdateDepartment(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & DepartmentUpdateRequestType) => {
      return await DepartmentService.updateDepartment(id, data);
    },
    ...options,
  });
}