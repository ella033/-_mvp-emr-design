"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useToastHelpers } from "@/components/ui/toast";
import { PermissionsService } from "@/services/permission-service";
import type { PermissionRoleSummary } from "@/types/permission-types";

type RoleDeleteButtonProps = {
  role: PermissionRoleSummary | null;
  onDeleted?: (roleId: number) => void;
  renderTrigger: (params: {
    onClick: () => void;
    isDeleting: boolean;
    disabled: boolean;
  }) => React.ReactNode;
};

export function RoleDeleteButton({
  role,
  onDeleted,
  renderTrigger,
}: RoleDeleteButtonProps) {
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const disabled = !role || role.isSystem;

  const closeConfirm = () => setConfirmOpen(false);

  const handleDelete = async () => {
    if (!role) return;
    setIsDeleting(true);
    try {
      const assignedUsers = await PermissionsService.getRoleUsers(role.id);
      if (assignedUsers.length > 0) {
        toast.error("대상자가 지정된 권한은 삭제할 수 없습니다.");
        closeConfirm();
        return;
      }

      await PermissionsService.deleteRole(role.id);
      toast.success("그룹이 삭제되었어요.");

      await queryClient.invalidateQueries({
        queryKey: ["permissions", "roles"],
      });
      await queryClient.refetchQueries({ queryKey: ["permissions", "roles"] });

      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey as unknown[]) &&
          (query.queryKey as unknown[]).includes(role.id),
      });

      onDeleted?.(role.id);
    } catch (error) {
      console.error(error);
      const message =
        (error as any)?.response?.data?.message ??
        (error as any)?.message ??
        "그룹 삭제에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      closeConfirm();
    }
  };

  return (
    <>
      {renderTrigger({
        onClick: () => setConfirmOpen(true),
        isDeleting,
        disabled,
      })}

      {confirmOpen && role && isMounted
        ? createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-md rounded-lg bg-popover p-5 shadow-xl border border-border">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  그룹 삭제
                </h3>
                <p className="text-sm text-muted-foreground">
                  "{role.name}" 그룹을 삭제하시겠습니까?
                </p>
                <p className="text-xs text-destructive">
                  대상자가 지정된 권한은 삭제할 수 없습니다.
                </p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="min-w-[72px] rounded-[4px] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={closeConfirm}
                  disabled={isDeleting}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="min-w-[72px] rounded-[4px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    void handleDelete();
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}
