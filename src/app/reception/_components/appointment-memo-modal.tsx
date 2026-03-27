"use client";

import { useState, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { useUpdateAppointment } from "@/hooks/appointment/use-update-appointment";
import { useToastHelpers } from "@/components/ui/toast";
import type { Appointment } from "@/types/appointments/appointments";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";

interface AppointmentMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: () => void;
}

export function AppointmentMemoModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
}: AppointmentMemoModalProps) {
  const [memo, setMemo] = useState("");
  const { mutate: updateAppointmentApi, isPending } = useUpdateAppointment();
  const { success, error: showError } = useToastHelpers();

  // appointment이 변경되거나 모달이 열릴 때 memo 불러오기
  useEffect(() => {
    if (isOpen && appointment) {
      setMemo(appointment.memo || "");
    } else if (!isOpen) {
      setMemo("");
    }
  }, [isOpen, appointment]);

  const handleSave = () => {
    if (!appointment?.id) return;

    updateAppointmentApi(
      {
        id: appointment.id,
        data: { ...appointment, memo },
      },
      {
        onSuccess: () => {
          success("예약메모가 저장되었습니다.");
          onSuccess?.();
          onClose();
        },
        onError: (error: Error) => {
          showError("예약메모 저장 실패", error.message);
        },
      }
    );
  };

  if (!isOpen || !appointment) return null;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="예약메모"
      width="500px"
      height="300px"
      alwaysCenter={true}
    >
      <div className="flex flex-col gap-2 h-full">
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="relative flex-1 min-h-[150px] p-2 pb-7 border border-[var(--border-secondary)] rounded-md bg-[var(--input-bg)] focus-within:outline-none focus-within:ring-2 focus-within:ring-primary">
            <MyTiptapEditor
              templateCodeType={TemplateCodeType.예약메모}
              placeholder="예약메모를 입력하세요"
              content={memo}
              onChange={setMemo}
              isUseImageUpload={false}
              isUseTemplate={true}
            />
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-[var(--input-bg)] border-[var(--border-secondary)] rounded-b-md">
              <TemplateCodeQuickBar
                templateCodeType={TemplateCodeType.예약메모}
                onTemplateClickAction={(template: TemplateCode) => {
                  setMemo((prev) => prev + template.content);
                }}
              />
            </div>
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
