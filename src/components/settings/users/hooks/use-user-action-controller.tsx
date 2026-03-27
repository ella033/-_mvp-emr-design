import { useState } from "react";
import { UserActionType } from "../model/user-action-types";
import { ExtendedUser, UserStatus } from "../model";
import { MyConfirmModal } from "@/components/yjg/my-confirm-modal";

interface UseUserActionControllerProps {
  onUpdateStatus: (userId: number, status: UserStatus) => void;
  onDeleteUser: (userId: number) => void; // Expects raw delete without confirm
  onCancelInvite: (userId: number) => void;
  onReinvite: (userId: number) => void;
}

interface ModalState {
  isOpen: boolean;
  type: UserActionType | null;
  user: ExtendedUser | null;
}

export function useUserActionController({
  onUpdateStatus,
  onDeleteUser,
  onCancelInvite,
  onReinvite,
}: UseUserActionControllerProps) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleAction = (type: UserActionType, user: ExtendedUser) => {
    setModalState({
      isOpen: true,
      type,
      user,
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, user: null });
    setIsLoading(false);
  };

  const confirmAction = async () => {
    const { type, user } = modalState;
    if (!type || !user) return;

    setIsLoading(true);

    try {
      switch (type) {
        case "SUSPEND":
          if (user.kind === 'HOSPITAL_USER') await onUpdateStatus(user.userId, UserStatus.SUSPENDED);
          break;
        case "UNSUSPEND":
          if (user.kind === 'HOSPITAL_USER') await onUpdateStatus(user.userId, UserStatus.ACTIVE);
          break;
        case "TERMINATE":
          // Soft Delete (Terminate)
          if (user.kind === 'HOSPITAL_USER') await onUpdateStatus(user.userId, UserStatus.TERMINATED);
          break;
        case "DELETE":
          // Hard Delete / Invitation Delete
          if (user.kind === 'INVITATION') {
            await onDeleteUser(user.invitedId);
          } else if (user.kind === 'HOSPITAL_USER') {
            await onDeleteUser(user.userId);
          }
          break;
        case "CANCEL_INVITE":
          if (user.kind === 'INVITATION') await onCancelInvite(user.invitedId);
          break;
        case "REINVITE":
          if (user.kind === 'INVITATION') await onReinvite(user.invitedId);
          break;
      }
      closeModal();
    } catch (error) {
      console.error("Action failed", error);
      setIsLoading(false);
    }
  };

  const getModalContent = () => {
    const { type, user } = modalState;
    if (!type || !user) return { title: "", description: "" };

    const userName = `${user.name ?? ''}${user.email ? `(${user.email})` : ""}`;

    switch (type) {
      case "SUSPEND":
        return {
          title: "사용 정지",
          description: `"${userName}" 님의 사용을 정지하시겠습니까?\n정지된 사용자는 시스템에 접근할 수 없습니다.`,
          confirmText: "사용 정지",
          isDestructive: true,
        };
      case "UNSUSPEND":
        return {
          title: "사용 정지 해제",
          description: `"${userName}" 님의 사용 정지를 해제하시겠습니까?\n해제 후 사용자는 시스템에 다시 접근할 수 있습니다.`,
          confirmText: "해제",
          isDestructive: false,
        };
      case "TERMINATE":
        return {
          title: "사용 종료",
          description: `"${userName}" 님을 사용 종료 처리하시겠습니까?\n종료 처리 시 복구가 불가능할 수 있습니다.`,
          subDescription: "데이터 삭제 복구 불가", // reusing existing logic concept
          confirmText: "사용 종료",
          isDestructive: true,
        };
      case "DELETE":
        return {
          title: "삭제",
          description: `"${userName}" 님을 정말로 삭제하시겠습니까?`,
          subDescription: "이 작업은 되돌릴 수 없습니다.",
          confirmText: "삭제",
          isDestructive: true,
        };
      case "CANCEL_INVITE":
        return {
          title: "초대 취소",
          description: `"${userName}" 님에게 보낸 초대를 취소하시겠습니까?`,
          confirmText: "초대 취소",
          isDestructive: true,
        };
      case "REINVITE":
        return {
          title: "다시 초대",
          description: `"${userName}" 님에게 초대 메일을 다시 보내시겠습니까?`,
          confirmText: "발송",
          isDestructive: false,
        };
      default:
        return { title: "", description: "" };
    }
  };

  const renderModal = () => {
    const { title, description, subDescription, confirmText, isDestructive } = getModalContent();

    return (
      <MyConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={confirmAction}
        title={title}
        description={description}
        subDescription={subDescription}
        confirmText={confirmText}
        isDestructive={isDestructive}
        isLoading={isLoading}
      />
    );
  };

  return {
    handleAction,
    renderModal,
  };
}
