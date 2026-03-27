import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";
import type { AuthLoginRequest, AuthLoginResponse } from "@/types/auth-types";

export function useLogin(options?: {
  onSuccess?: (data: AuthLoginResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: AuthLoginRequest) => {
      return await AuthService.login(credentials);
    },
    ...options,
  });
}
