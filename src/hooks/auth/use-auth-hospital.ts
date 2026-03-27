import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";
import type {
  AuthGetHospitalsRequest,
  AuthUserHospital,
} from "@/types/auth-types";

export function useGetHospitals(options?: {
  onSuccess?: (data: AuthUserHospital[]) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: AuthGetHospitalsRequest) => {
      return await AuthService.getHospitals(credentials);
    },
    ...options,
  });
}
