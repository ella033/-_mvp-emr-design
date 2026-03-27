export type PermissionAction = "read" | "manage";

export interface Permission {
  name: string; // 예: "접수"
  action: PermissionAction;
  subject: string; // 예: "reception"
}

export interface PermissionRoleSummary {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
}

export interface PermissionRolePermission {
  subject: string;
  action: string;
}

export interface PermissionAssignment {
  subject: string;
  action: PermissionAction;
}
