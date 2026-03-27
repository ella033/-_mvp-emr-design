export type * from "@/types/permission-types";

// UI-specific types that were locally defined in permission_infos.tsx
export type PermissionLevel = "none" | "view" | "edit";

export type PermissionRow = {
  id: string;
  name: string;
  description?: string;
  level: PermissionLevel;
  subject: string;
};

export type UserStatus = "active" | "disabled" | "ended" | "unknown";

export type CombinedUserRow = {
  key: string;
  userId: number;
  name: string;
  englishName: string;
  title: string;
  department: string;
  statusLabel: UserStatus;
  statusText: string;
  statusCode: number | null;
  roleName: string;
  roleId: number | null;
  userTypeName: string;
  specialtyName: string;
  isAssigned: boolean;
  isOwner: boolean;
  createdAt: string;
};
