import { useMutation } from "@tanstack/react-query";
import { UsersService } from "@/services/users-service";
import type { UpdateUserRequest, UpdateUserResponse } from "@/types/user-types";

export function useUpdateUser(options?: {
  onSuccess?: (data: UpdateUserResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({ id, user }: { id: number; user: UpdateUserRequest }) =>
      UsersService.updateUser(id, user),
    ...options,
  });
}
