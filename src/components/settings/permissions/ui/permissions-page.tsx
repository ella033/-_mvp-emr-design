"use client";

import { useState } from "react";

import PermissionGroups from "./permission_groups";
import PermissionInfos from "./permission_infos";
import type { PermissionRoleSummary } from "../model";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";

export function PermissionsPage() {
  const [selectedRole, setSelectedRole] =
    useState<PermissionRoleSummary | null>(null);
  const [createdRoleName, setCreatedRoleName] = useState<string | null>(null);
  const [isCreatingMode, setIsCreatingMode] = useState(false);

  return (
    <div
      className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]"
      data-testid="settings-permissions-page"
    >
      <SettingPageHeader
        title="권한 관리"
        tooltipContent="병원 대표자는 모든 기능에 접근하고 관리할 수 있습니다."
      />
      <section className="flex flex-col lg:flex-row gap-[20px] w-full min-h-[500px] lg:min-h-[600px] flex-1 overflow-hidden">
        <div className="flex flex-1 min-w-[480px] min-h-[500px]">
          <PermissionGroups
            selectedRole={selectedRole}
            onSelect={(role) => {
              setSelectedRole(role);
              setIsCreatingMode(false);
            }}
            onStartCreate={() => {
              setSelectedRole(null);
              setIsCreatingMode(true);
            }}
            createdRoleName={createdRoleName}
            onCreatedRoleHandled={() => setCreatedRoleName(null)}
            isCreatingMode={isCreatingMode}
          />
        </div>
        <div className="flex flex-3 min-h-[500px]">
          <PermissionInfos
            selectedRole={selectedRole}
            onRoleCreated={(roleName, _roleId) => {
              setCreatedRoleName(roleName);
              setSelectedRole(null);
              setIsCreatingMode(false);
            }}
            onSaved={() => {
              // No refresh signal needed
            }}
            onRoleDeleted={() => {
              setSelectedRole(null);
              setIsCreatingMode(false);
            }}
          />
        </div>
      </section>
    </div>
  );
}
