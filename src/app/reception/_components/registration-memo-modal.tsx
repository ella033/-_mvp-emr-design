"use client";

import { useState, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useToastHelpers } from "@/components/ui/toast";
import type { Registration } from "@/types/registration-types";
import { ReceptionService } from "@/services/reception-service";

interface RegistrationMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  onSuccess?: () => void;
}

export function RegistrationMemoModal({
  isOpen,
  onClose,
  registration,
  onSuccess,
}: RegistrationMemoModalProps) {
  const [memo, setMemo] = useState("");
  const { mutate: updateRegistrationApi, isPending } = useUpdateRegistration();
  const { success, error: showError } = useToastHelpers();

  // registration이 변경되거나 모달이 열릴 때 receptionMemo 불러오기
  useEffect(() => {
    if (isOpen && registration) {
      const reception = ReceptionService.convertRegistrationToReception(registration);
      setMemo(reception.patientBaseInfo.receptionMemo || "");
    } else if (!isOpen) {
      setMemo("");
    }
  }, [isOpen, registration]);

  const handleSave = () => {
    if (!registration) return;

    updateRegistrationApi(
      {
        id: String(registration.id),
        data: { memo },
      },
      {
        onSuccess: () => {
          success("접수메모가 저장되었습니다.");
          onSuccess?.();
          onClose();
        },
        onError: (error: Error) => {
          showError("접수메모 저장 실패", error.message);
        },
      }
    );
  };

  if (!isOpen || !registration) return null;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="접수메모"
      width="500px"
      height="300px"
      alwaysCenter={true}
    >
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            접수메모
          </label>
          <div className="flex-1 min-h-0">
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="접수메모를 입력하세요"
              className="w-full h-full p-2 border border-[var(--border-secondary)] rounded-md bg-[var(--input-bg)] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ minHeight: "150px" }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border-secondary)] pt-4">
          <MyButton variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </MyButton>
          <MyButton onClick={handleSave} disabled={isPending}>
            {isPending ? "저장 중..." : "저장"}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
