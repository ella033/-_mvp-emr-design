import { useQuery } from "@tanstack/react-query";
import { DepartmentIntegratedService } from "@/services/department-integrated-service";

export function useDepartmentsWithPositions() {
  return useQuery({
    queryKey: ["departments-with-positions"],
    queryFn: async () => {
      return await DepartmentIntegratedService.getDepartmentsWithPositions();
    },
  });
} 