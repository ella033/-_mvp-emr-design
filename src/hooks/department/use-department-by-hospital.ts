import { useQuery } from "@tanstack/react-query";
import { DepartmentService } from "@/services/department-service";

export function useDepartmentByHospital(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useQuery({
    queryKey: ["departmentByHospital"],
    queryFn: async () => {
      return await DepartmentService.getDepartments();
    },
    ...options,
  });
}