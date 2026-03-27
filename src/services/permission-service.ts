import { ApiClient } from "@/lib/api/api-client";
import { permissionsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  PermissionRoleSummary,
  PermissionRolePermission,
  PermissionRolePayload,
  PermissionRoleUser,
  UpdateUserRoleRequest,
} from "@/types/permission-types";

export class PermissionsService {
  static async getRoles(): Promise<PermissionRoleSummary[]> {
    try {
      return await ApiClient.get<PermissionRoleSummary[]>(permissionsApi.roles);
    } catch (_) {
      throw new Error("Failed to load permission roles");
    }
  }

  static async getRolePermissions(
    roleId: number | string
  ): Promise<PermissionRolePermission[]> {
    const validatedRoleId = validateId(roleId, "Role ID");
    try {
      return await ApiClient.get<PermissionRolePermission[]>(
        permissionsApi.rolePermissions(validatedRoleId)
      );
    } catch (_) {
      throw new Error("Failed to load permissions for the role");
    }
  }

  static async getRoleUsers(
    roleId: number | string
  ): Promise<PermissionRoleUser[]> {
    const validatedRoleId = validateId(roleId, "Role ID");
    try {
      return await ApiClient.get<PermissionRoleUser[]>(
        permissionsApi.roleUsers(validatedRoleId)
      );
    } catch (_) {
      throw new Error("Failed to load users for the role");
    }
  }

  static async createRole(
    payload: PermissionRolePayload
  ): Promise<PermissionRoleSummary> {
    try {
      return await ApiClient.post<PermissionRoleSummary>(
        permissionsApi.roles,
        payload
      );
    } catch (_) {
      throw new Error("Failed to create permission role");
    }
  }

  static async updateRole(
    roleId: number | string,
    payload: PermissionRolePayload
  ): Promise<void> {
    const validatedRoleId = validateId(roleId, "Role ID");
    try {
      await ApiClient.patch(permissionsApi.roleDetail(validatedRoleId), payload);
    } catch (_) {
      throw new Error("Failed to update permission role");
    }
  }

  static async updateUserRole(payload: UpdateUserRoleRequest): Promise<void> {
    try {
      await ApiClient.patch(permissionsApi.userRole, payload);
    } catch (_) {
      throw new Error("Failed to update user role");
    }
  }

  static async deleteRole(roleId: number | string): Promise<void> {
    const validatedRoleId = validateId(roleId, "Role ID");
    try {
      await ApiClient.delete(permissionsApi.roleDetail(validatedRoleId));
    } catch (_) {
      throw new Error("Failed to delete permission role");
    }
  }
}
