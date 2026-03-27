"use client";

import { useEffect, useState } from "react";
import { UserListPanel } from "./user-list-panel";
import { UserDetailPanel } from "./user-detail-panel";
import { InviteUserModal } from "./invite-user-modal";
import { useUserManagement } from "../hooks/use-user-management";
import { useUserActionController } from "../hooks/use-user-action-controller";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import MySplitPane from "@/components/yjg/my-split-pane";
import type { ExtendedUser } from "../model";

export function UsersPage() {
  // Hardcoded hospital ID for demo context
  const HOSPITAL_ID = 1;

  const {
    users,
    inviteUser,
    cancelInvite,
    reInvite,
    updateUserStatus,
    saveUser,
    deleteUser,
  } = useUserManagement(HOSPITAL_ID);

  // CHANGED: Manage explicit ID and Kind
  const [selectedState, setSelectedState] = useState<{ id: number; kind: 'INVITATION' | 'HOSPITAL_USER' } | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Action Controller
  const { handleAction, renderModal } = useUserActionController({
    onUpdateStatus: updateUserStatus,
    onDeleteUser: (userId) => {
      deleteUser(userId);
      // If deleted user was selected, deselect
      if (selectedState?.id === userId) {
        setSelectedState(null);
      }
    },
    onCancelInvite: (userId) => {
      cancelInvite(userId);
      if (selectedState?.id === userId) {
        setSelectedState(null);
      }
    },
    onReinvite: reInvite,
  });

  // Helper to handle selection from list
  const handleSelectUser = (user: ExtendedUser) => {
    // Determine explicit Kind.
    // If user object has 'kind' property we trust it.
    // Fallback: Check uiStatus if needed?
    // ExtendedUser type has 'kind' as discriminator.
    // Ensure we extract the stable list ID.
    const id = (user.kind === 'INVITATION' ? user.invitedId : user.userId) || user.id;
    const kind = user.kind;

    setSelectedState({ id, kind });
  };

  const handleCloseDetail = () => {
    setSelectedState(null);
  };

  const [isLg, setIsLg] = useState(true);
  useEffect(() => {
    const checkSize = () => {
      setIsLg(window.innerWidth >= 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const panes = [
    <UserListPanel
      users={users}
      selectedUserId={selectedState?.id || null}
      onSelectUser={handleSelectUser}
      onInviteClick={() => setIsInviteModalOpen(true)}
      onAction={handleAction}
    />,
    selectedState ? (
      <UserDetailPanel
        userId={selectedState.id}
        userKind={selectedState.kind}
        onAction={handleAction}
        onSaveUser={saveUser}
        onClose={handleCloseDetail}

        // Configuration for Admin View
        fieldConfig={{
          'roleName': { editable: true },
          'endDate': { editable: true },
          'uiStatus': { editable: true },
          'name': { editable: false },
          'email': { editable: false },
        }}
      />
    ) : (
      <div className="flex-1 h-full flex items-center justify-center bg-background text-muted-foreground border rounded-lg">
        사용자를 선택해주세요.
      </div>
    )
  ];

  return (
    <div
      className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]"
      data-testid="settings-users-page"
    >
      {/* Action Modal */}
      {renderModal()}

      {/* Header */}
      <SettingPageHeader
        title="사용자 관리"
        tooltipContent="사용자 관리"
      />
      {/* Content: Split Layout */}
      <MySplitPane
        splitPaneId="users-split"
        isVertical={!isLg} // Desktop: Horizontal (Row, false), Mobile: Vertical (Column, true)
        panes={panes}
        minPaneRatio={0.25}
        initialRatios={[0.25, 0.75]}
        gap={20}
      />

      {/* Modals */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={inviteUser}
      />
    </div>
  );
}
