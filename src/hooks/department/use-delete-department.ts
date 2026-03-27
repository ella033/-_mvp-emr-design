import { useMutation } from "@tanstack/react-query";
import { DepartmentService } from "@/services/department-service";

export function useDeleteDepartment(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async (id: string) => {
      return await DepartmentService.deleteDepartment(id);
    },
    ...options,
  });
}