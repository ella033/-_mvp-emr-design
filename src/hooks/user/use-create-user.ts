import { useMutation } from "@tanstack/react-query";
import { UsersService } from "@/services/users-service";
import type { CreateUserRequest, CreateUserResponse } from "@/types/user-types";

export function useCreateUser(options?: {
  onSuccess?: (data: CreateUserResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (user: CreateUserRequest) => UsersService.createUser(user),
    ...options,
  });
}
