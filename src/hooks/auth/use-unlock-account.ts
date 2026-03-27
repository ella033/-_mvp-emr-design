import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/auth-service";
import type {
  RequestUnlockTokenRequest,
  ResetPasswordWithTokenRequest,
  VerifyUnlockTokenRequest,
  VerifyUnlockTokenResponse,
} from "@/types/auth-types";

export function useRequestUnlockToken(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: RequestUnlockTokenRequest) => {
      return await AuthService.requestUnlockToken(credentials);
    },
    ...options,
  });
}

export function useRequestPasswordResetToken(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: RequestUnlockTokenRequest) => {
      return await AuthService.requestPasswordResetToken(credentials);
    },
    ...options,
  });
}

export function useVerifyUnlockToken(options?: {
  onSuccess?: (data: VerifyUnlockTokenResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: VerifyUnlockTokenRequest) => {
      return await AuthService.verifyUnlockToken(credentials);
    },
    ...options,
  });
}

export function useResetPasswordWithToken(options?: {
  onSuccess?: (data: { message: string }) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (credentials: ResetPasswordWithTokenRequest) => {
      return await AuthService.resetPasswordWithToken(credentials);
    },
    ...options,
  });
}
