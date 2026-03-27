import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/services/users-service";
export const useUser = (id: number) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      return UsersService.getUser(id);
    },
    enabled: !!id && typeof id === "number" && id > 0,
  });
};
