import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";

export function useSessionPing(options?: {
  onSuccess?: (data: void) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async () => {
      return await AuthService.sessionPing();
    },
    ...options,
  });
}
