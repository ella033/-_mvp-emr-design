import { PermissionAction } from "@/types/permission-types";
import { usePermission } from "@/hooks/use-permission";

interface PermissionGuardProps {
  children: React.ReactNode;
  subject: string;
  action?: PermissionAction;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  subject,
  action = "read", // Default action is read
  fallback = null,
}: PermissionGuardProps) {
  const { canRead, canManage } = usePermission(subject);

  // If action is 'manage', need manage permission
  if (action === "manage" && !canManage) {
    return <>{fallback}</>;
  }

  // If action is 'read', need read or manage permission (canRead handles both logic in hook usually, but let's trust usePermission)
  if (action === "read" && !canRead) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
