import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";
import type { AuthLogoutResponse } from "@/types/auth-types";

export function useLogout(options?: {
  onSuccess?: (data: AuthLogoutResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async () => {
      return await AuthService.logout();
    },
    ...options,
  });
}
