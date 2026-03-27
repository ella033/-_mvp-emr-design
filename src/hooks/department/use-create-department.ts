import { useMutation } from "@tanstack/react-query";
import { DepartmentService } from "@/services/department-service";

export function useCreateDepartment(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: async (data: any) => {
      return await DepartmentService.createDepartment(data);
    },
    ...options,
  });
}
