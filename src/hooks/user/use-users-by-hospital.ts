import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/services/users-service";
export const useUsersByHospital = (hospitalId: number) => {
  return useQuery({
    queryKey: ["users", hospitalId],
    queryFn: async () => {
      return UsersService.getUsersByHospital(hospitalId);
    },
    enabled: !!hospitalId && typeof hospitalId === "number" && hospitalId > 0, // hospitalId가 있을 때만 쿼리 실행
  });
};
