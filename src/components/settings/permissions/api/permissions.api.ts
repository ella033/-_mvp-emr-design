import { PermissionsService } from "@/services/permission-service";
import { UsersService } from "@/services/users-service";
import type {
  PermissionRolePayload,
  PermissionRolePermission,
  PermissionRoleSummary,
  UpdateUserRoleRequest,
} from "../model";

export const permissionsApi = {
  getRoles: () => PermissionsService.getRoles(),
  getRolePermissions: (roleId: number | string) =>
    PermissionsService.getRolePermissions(roleId),
  createRole: (payload: PermissionRolePayload) =>
    PermissionsService.createRole(payload),
  updateRole: (roleId: number | string, payload: PermissionRolePayload) =>
    PermissionsService.updateRole(roleId, payload),
  deleteRole: (roleId: number | string) => PermissionsService.deleteRole(roleId),
  updateUserRole: (payload: UpdateUserRoleRequest) =>
    PermissionsService.updateUserRole(payload),

  // Also using UsersService as it was used in permission_infos.tsx
  getHospitalUsers: (hospitalId: number) => UsersService.getUsersByHospital(hospitalId),
};
