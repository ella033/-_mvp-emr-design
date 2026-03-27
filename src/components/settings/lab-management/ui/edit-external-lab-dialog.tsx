"use client";

import { useState, useEffect, useMemo } from "react";
import MyPopUp from "@/components/yjg/my-pop-up";
import { useUpdateLab } from "@/hooks/api/use-external-lab";
import { useToastHelpers } from "@/components/ui/toast";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";

interface EditExternalLabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lab: ExternalLab | null;
}

export const EditExternalLabDialog = ({
  open,
  onOpenChange,
  lab,
}: EditExternalLabDialogProps) => {
  const toastHelpers = useToastHelpers();
  const [formData, setFormData] = useState({
    agencyName: "",
    medicalInstitutionNumber: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateLab = useUpdateLab({
    onSuccess: () => {
      setErrorMessage(null);
      toastHelpers.success("수정 완료", "수탁기관 정보가 수정되었습니다.");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("수탁기관 정보 수정 실패:", error);
      const errorMsg = error?.message || "수탁기관 정보 수정에 실패했습니다.";
      setErrorMessage(errorMsg);
      toastHelpers.error("수정 실패", errorMsg);
    },
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open && lab) {
      setFormData({
        agencyName: lab.name || "",
        medicalInstitutionNumber: lab.code || "",
      });
      setErrorMessage(null);
    }
  }, [open, lab]);

  // 모든 필드가 채워졌는지 확인
  const isFormValid = useMemo(() => {
    return (
      formData.agencyName.trim() !== "" &&
      formData.medicalInstitutionNumber.trim() !== ""
    );
  }, [formData]);

  // 변경 감지
  const hasChanges = useMemo(() => {
    if (!lab) return false;
    return (
      formData.agencyName !== lab.name ||
      formData.medicalInstitutionNumber !== lab.code
    );
  }, [formData, lab]);

  const handleSubmit = () => {
    if (!lab || !isFormValid || !hasChanges) return;

    // 필수 필드 검증
    if (!formData.agencyName.trim()) {
      toastHelpers.error("기관명을 입력해주세요.");
      return;
    }
    if (!formData.medicalInstitutionNumber.trim()) {
      toastHelpers.error("요양기관번호를 입력해주세요.");
      return;
    }

    // 수탁기관 정보 수정 API 호출
    updateLab.mutate({
      id: lab.id,
      data: {
        name: formData.agencyName.trim(),
        code: formData.medicalInstitutionNumber.trim(),
      },
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isLoading = updateLab.isPending;

  return (
    <MyPopUp
      isOpen={open}
      onCloseAction={() => {
        if (!isLoading) handleCancel();
      }}
      title="수탁기관 정보 수정"
      fitContent={true}
    >
      <div className="flex flex-col w-[500px]">
        <div className="flex flex-1 flex-col gap-[20px] p-[14px]">
          {/* 기관명 | 요양기관번호 */}
          <div className="flex gap-[12px]">
            <div className="flex flex-col flex-1 gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                기관명 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                placeholder="기관명을 입력하세요"
                value={formData.agencyName}
                onChange={(e) =>
                  setFormData({ ...formData, agencyName: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col flex-1 gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                요양기관번호 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                placeholder="요양기관번호를 입력하세요"
                value={formData.medicalInstitutionNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medicalInstitutionNumber: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="text-[13px] text-destructive font-medium text-center py-2 px-[14px]">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-[8px] p-[16px]">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || !hasChanges || isLoading}
            className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px] cursor-pointer"
          >
            {isLoading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </MyPopUp>
  );
};
