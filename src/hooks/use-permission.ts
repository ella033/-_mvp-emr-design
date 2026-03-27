import { PermissionAction } from "@/types/permission-types";
import { usePermissionStore } from "@/store/permission-store";

export function usePermission(subject: string) {
  const hasPermission = usePermissionStore((state) => state.hasPermission);

  return {
    canRead: hasPermission(subject, "read"),
    canManage: hasPermission(subject, "manage"),
  };
}
