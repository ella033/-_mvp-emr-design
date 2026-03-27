import { useMutation } from "@tanstack/react-query";
import { UsersService } from "@/services/users-service";
import type { DeleteUserResponse } from "@/types/user-types";

export const useDeleteUser = (options?: {
  onSuccess?: (data: DeleteUserResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: number) => UsersService.deleteUser(id),
    ...options,
  });
};
