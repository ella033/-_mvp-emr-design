import { useQuery } from "@tanstack/react-query";
import { DepartmentPositionService } from "@/services/department-position-service";

export function useDepartmentPositionsByDepartment(departmentId: string, options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useQuery({
    queryKey: ["departmentPositionsByDepartment", departmentId],
    queryFn: async () => {
      return await DepartmentPositionService.getPositionsByDepartment(departmentId);
    },
    ...options,
  });
} 