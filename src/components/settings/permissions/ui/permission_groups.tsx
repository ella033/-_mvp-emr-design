"use client";

import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { PermissionRoleSummary } from "../model";
import { usePermissionRoles } from "../hooks/use-permission-roles";
import { RoleDeleteButton } from "./role_delete_button";

type Props = {
  selectedRole: PermissionRoleSummary | null;
  onSelect: (role: PermissionRoleSummary | null) => void;
  onStartCreate?: () => void;
  createdRoleName?: string | null;
  onCreatedRoleHandled?: () => void;
  isCreatingMode?: boolean;
  refreshSignal?: number;
};

export default function PermissionGroups({
  selectedRole,
  onSelect,
  onStartCreate,
  createdRoleName,
  onCreatedRoleHandled,
  isCreatingMode = false,
  refreshSignal, // Handled implicitly by React Query invalidation
}: Props) {
  const {
    roles: groups,
    systemGroups,
    userGroups,
    isLoading,
    // error, // Can use for error state display
  } = usePermissionRoles();

  // Auto-select first role logic
  useEffect(() => {
    if (!selectedRole && groups.length > 0 && !isCreatingMode) {
      onSelect(groups[0]);
    }
  }, [groups, selectedRole, isCreatingMode, onSelect]);

  // Select newly created role logic
  useEffect(() => {
    if (createdRoleName && groups.length > 0) {
      const found = groups.find(r => r.name === createdRoleName);
      if (found) {
        onSelect(found);
        onCreatedRoleHandled?.();
      }
    }
  }, [groups, createdRoleName, onSelect, onCreatedRoleHandled]);

  const renderGroupItem = (group: PermissionRoleSummary) => {
    const isSelected = selectedRole?.id === group.id;
    const handleSelect = () => onSelect(group);

    return (
      <div key={group.id}>
        <div
          role="button"
          tabIndex={0}
          className={`flex w-full justify-between items-center self-stretch border rounded-[6px] px-[8px] py-[16px] pl-[12px] text-left bg-card cursor-pointer hover:border-foreground ${isSelected ? "border-foreground" : "border-border"
            }`}
          onClick={handleSelect}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleSelect();
            }
          }}
        >
          <div className="min-w-0">
            <p
              className={`text-sm text-foreground ${isSelected ? "font-bold" : "font-normal"}`}
            >
              {group.name}
            </p>
          </div>
          {!group.isSystem && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span
                  role="button"
                  tabIndex={0}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }}
                >
                  <MoreHorizontal
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">그룹 옵션</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-32"
                forceMount
              >
                <RoleDeleteButton
                  role={group}
                  onDeleted={async () => {
                    // Hook handles invalidation.
                    // We might want to clear selection if we deleted the selected role?
                    // But typically parent handles "if deleted selected, select null".
                    // Actually `PermissionsPage` listens to `onRoleDeleted` prop in `PermissionInfos` for cleaning up.
                    // But here we are deleting from the list. 
                    // If we delete the *currently selected* role, `selectedRole` prop won't update automatically to null unless parent knows.
                    // `RoleDeleteButton` in this file is separate from `RoleDeleteButton` in `PermissionInfos`.
                    // If we delete here, we should probably notify parent? 
                    // The original code passed `onDeleted` which re-fetched.
                    // If we delete here, `groups` will update. `useEffect` will pick the first one.
                  }}
                  renderTrigger={({ onClick, isDeleting: isBtnDeleting, disabled }) => (
                    <DropdownMenuItem
                      className="text-rose-600 focus:text-rose-700"
                      disabled={disabled || isBtnDeleting}
                      onSelect={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onClick();
                      }}
                    >
                      {isBtnDeleting ? "삭제 중..." : "삭제"}
                    </DropdownMenuItem>
                  )}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  const setIsAddFormOpen = (cb: (prev: boolean) => boolean) => {
    // Just a proxy to trigger onStartCreate, as we are reusing the existing structure where the button triggers create mode
    if (cb(false)) onStartCreate?.();
  };

  return (
    <section className="flex flex-col h-full w-full border border-border rounded-lg p-4 gap-4" data-testid="settings-permissions-groups">
      <header className="flex justify-between items-center">
        <h2 className="font-pretendard text-[16px] font-bold leading-[140%] tracking-[-0.16px] text-foreground">
          권한 목록
        </h2>
        <button
          type="button"
          data-testid="settings-permissions-add-role-button"
          className="flex items-center justify-center gap-1 rounded-[4px] px-3 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition"
          onClick={() => onStartCreate?.()}
        >
          <span className="text-[18px] leading-none font-bold">+</span> 권한
          생성
        </button>
      </header>
      <div className="flex-1 flex-col gap-[12px] flex overflow-y-auto w-full">
        {isLoading && (
          <div className="text-center py-4 text-sm text-muted-foreground">로딩 중...</div>
        )}
        {!isLoading && (
          <>
            <div
              className="flex items-center h-6 gap-2 text-foreground font-pretendard text-[14px] font-bold leading-[125%] tracking-[-0.14px]"
            >
              기본 권한
            </div>
            <div className="flex flex-col gap-[12px] w-full">
              {systemGroups?.map((group) => renderGroupItem(group))}
            </div>

            <div
              className="flex items-center h-6 gap-2 text-foreground font-pretendard text-[14px] font-bold leading-[125%] tracking-[-0.14px]"
            >
              사용자 권한
            </div>
            <div className="flex flex-col gap-[12px] w-full">
              {userGroups?.map((group) => renderGroupItem(group))}
            </div>
          </>
        )}
      </div>
      <footer className="flex">
        <button
          className="flex items-center gap-1 min-h-[16px] max-h-[16px] overflow-hidden text-[13px] font-pretendard font-normal leading-[125%] text-center text-primary truncate"
          onClick={() => onStartCreate?.()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          권한 변경 내역 보기
        </button>
      </footer>
    </section>
  );
}
