import { useQuery } from "@tanstack/react-query";

import { PermissionsService } from "@/services/permission-service";
import { UsersService } from "@/services/users-service";

type OptionalQueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  onError?: (error: unknown) => void;
};

export const usePermissionRolesQuery = (options?: OptionalQueryOptions) => {
  return useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: async () => await PermissionsService.getRoles(),
    staleTime: 60_000,
    ...options,
  });
};

export const useRolePermissionsQuery = (
  roleId: number | null,
  options?: OptionalQueryOptions
) => {
  return useQuery({
    queryKey: ["permissions", "role", roleId ?? "none", "permissions"],
    queryFn: async () => {
      if (!roleId || typeof roleId !== "number") {
        throw new Error("Role ID is required");
      }
      return await PermissionsService.getRolePermissions(roleId);
    },
    enabled: !!roleId && typeof roleId === "number" && roleId > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useHospitalUsersQuery = (
  hospitalId: number,
  options?: OptionalQueryOptions
) => {
  return useQuery({
    queryKey: ["users", "hospital", hospitalId],
    queryFn: async () => await UsersService.getUsersByHospital(hospitalId),
    staleTime: 60_000,
    ...options,
  });
};
