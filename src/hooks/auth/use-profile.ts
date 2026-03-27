import { AuthService } from "@/services/auth-service";
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      return await AuthService.getProfile();
    },
  });
}
