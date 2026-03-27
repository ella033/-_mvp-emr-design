import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";
import type { AuthRefreshResponse } from "@/types/auth-types";

export function useRefreshToken(options?: {
  onSuccess?: (data: AuthRefreshResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async () => {
      return await AuthService.refreshToken();
    },
    ...options,
  });
}
