"use client";

import { useState, useEffect, useMemo } from "react";
import MyPopUp, { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import InputDate from "@/components/ui/input-date";
import { CERTIFICATION_STATUSES, type CertificationStatus, formatCertified, QUALITY_GRADES, formatQualityGrade } from "./lab-constants";

interface EditQualityGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    applyDate: string;
    qualityGrade?: number;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  };
  onSave?: (data: {
    applyDate: string;
    qualityGrade: number;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  }) => void;
  onDelete?: () => void;
}

export const EditQualityGradeDialog = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  onDelete,
}: EditQualityGradeDialogProps) => {
  const [formData, setFormData] = useState<{
    applyDate: string;
    qualityGrade: number;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  }>({
    applyDate: "",
    qualityGrade: 1,
    pathologyCertified: null,
    nuclearMedicineCertified: null,
  });

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          applyDate: initialData.applyDate || "",
          qualityGrade: initialData.qualityGrade || 1,
          pathologyCertified: initialData.pathologyCertified || null,
          nuclearMedicineCertified: initialData.nuclearMedicineCertified || null,
        });
      } else {
        setFormData({
          applyDate: "",
          qualityGrade: 1,
          pathologyCertified: null,
          nuclearMedicineCertified: null,
        });
      }
    }
  }, [open, initialData]);

  const isFormValid = useMemo(() => {
    return (
      formData.applyDate.trim() !== "" &&
      formData.pathologyCertified !== null &&
      formData.nuclearMedicineCertified !== null
    );
  }, [formData]);

  const handleSubmit = () => {
    if (onSave) {
      onSave(formData);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete();
    }
    setIsDeleteConfirmOpen(false);
  };

  return (
    <>
      <MyPopUp
        isOpen={open}
        onCloseAction={() => {
          handleCancel();
        }}
        title="질가산등급 추가(수정)"
        fitContent={true}
      >
        <div className="flex flex-col w-[600px]">
          <div className="flex flex-1 flex-col gap-[20px] p-[14px]">
            {/* 적용일자 | 질가산등급 | 병리검사 | 핵의학검사 */}
            <div className="flex gap-[12px]">
              <div className="flex flex-col flex-1 gap-[6px]">
                <label className="text-[13px] font-bold text-foreground leading-[16px]">
                  적용일자
                </label>
                <div className="h-[40px]">
                  <InputDate
                    value={formData.applyDate}
                    onChange={(value) =>
                      setFormData({ ...formData, applyDate: value })
                    }
                    className="w-full h-[40px] text-[13px] border-border rounded-[6px] focus-visible:ring-0 focus-visible:border-primary bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[6px]">
                <label className="text-[13px] font-bold text-foreground leading-[16px]">
                  질가산등급
                </label>
                <div className="relative">
                  <select
                    className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                    value={String(formData.qualityGrade)}
                    onChange={(e) => {
                      const grade = parseInt(e.target.value, 10);
                      if (!isNaN(grade)) {
                        setFormData({ ...formData, qualityGrade: grade });
                      }
                    }}
                  >
                    <option value="" disabled className="text-muted-foreground">선택하세요</option>
                    {QUALITY_GRADES.map((grade) => (
                      <option key={grade.value} value={String(grade.value)} className="text-foreground">
                        {formatQualityGrade(grade.value)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[6px]">
                <label className="text-[13px] font-bold text-foreground leading-[16px]">
                  병리검사
                </label>
                <div className="relative">
                  <select
                    className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                    value={formData.pathologyCertified?.value === true ? "true" : formData.pathologyCertified?.value === false ? "false" : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const boolValue = value === "true";
                      const status = CERTIFICATION_STATUSES.find(s => s.value === boolValue);
                      if (status) {
                        setFormData({ ...formData, pathologyCertified: status });
                      }
                    }}
                    style={{
                      color: formData.pathologyCertified ? "inherit" : "var(--muted-foreground)"
                    }}
                  >
                    <option value="" disabled className="text-muted-foreground">인증여부</option>
                    {CERTIFICATION_STATUSES.map((status) => (
                      <option key={String(status.value)} value={String(status.value)} className="text-foreground">
                        {formatCertified(status.value)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1 gap-[6px]">
                <label className="text-[13px] font-bold text-foreground leading-[16px]">
                  핵의학검사
                </label>
                <div className="relative">
                  <select
                    className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                    value={formData.nuclearMedicineCertified?.value === true ? "true" : formData.nuclearMedicineCertified?.value === false ? "false" : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const boolValue = value === "true";
                      const status = CERTIFICATION_STATUSES.find(s => s.value === boolValue);
                      if (status) {
                        setFormData({ ...formData, nuclearMedicineCertified: status });
                      }
                    }}
                    style={{
                      color: formData.nuclearMedicineCertified ? "inherit" : "var(--muted-foreground)"
                    }}
                  >
                    <option value="" disabled className="text-muted-foreground">인증여부</option>
                    {CERTIFICATION_STATUSES.map((status) => (
                      <option key={String(status.value)} value={String(status.value)} className="text-foreground">
                        {formatCertified(status.value)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-[16px]">
            <div>
              {onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="h-[32px] px-[12px] rounded-[4px] bg-destructive/10 text-[13px] text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="flex gap-[8px]">
              <button
                onClick={handleCancel}
                className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </MyPopUp>

      <MyPopupYesNo
        isOpen={isDeleteConfirmOpen}
        onCloseAction={() => setIsDeleteConfirmOpen(false)}
        onConfirmAction={handleDeleteConfirm}
        title="삭제 확인"
        message="정말 삭제하시겠습니까?"
        yesText="확인"
        noText="취소"
      />
    </>
  );
};

