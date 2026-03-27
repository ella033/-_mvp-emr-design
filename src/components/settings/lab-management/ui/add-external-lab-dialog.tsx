"use client";

import { useState, useEffect, useMemo } from "react";
import InputDate from "@/components/ui/input-date";
import MyPopUp from "@/components/yjg/my-pop-up";
import { useToastHelpers } from "@/components/ui/toast";
import { QUALITY_GRADES, CERTIFICATION_STATUSES, type CertificationStatus, formatCertified } from "./lab-constants";

interface AddExternalLabDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // TODO: Use specific types from model if available, for now define function signatures
  onCreateLab: (data: { code: string; name: string }) => Promise<{ id: string }>;
  onCreateGrade: (params: { id: string; data: { qualityGrade: number; isPathologyCertified: boolean; isNuclearMedicineCertified: boolean; applyDate: string } }) => Promise<any>;
}

// 날짜를 ISO 8601 형식으로 변환 (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss+09:00)
const formatDateToISO = (dateString: string): string => {
  if (!dateString) return "";
  // YYYY-MM-DD 형식의 날짜를 ISO 8601 형식으로 변환
  return `${dateString}T00:00:00+09:00`;
};

export const AddExternalLabDialog = ({
  open,
  onOpenChange,
  onCreateLab,
  onCreateGrade
}: AddExternalLabDialogProps) => {
  const toastHelpers = useToastHelpers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    agencyName: string;
    medicalInstitutionNumber: string;
    applyDate: string;
    qualityGrade: string;
    pathologyCertified: CertificationStatus | null;
    nuclearMedicineCertified: CertificationStatus | null;
  }>({
    agencyName: "",
    medicalInstitutionNumber: "",
    applyDate: "",
    qualityGrade: "",
    pathologyCertified: null,
    nuclearMedicineCertified: null,
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open) {
      setFormData({
        agencyName: "",
        medicalInstitutionNumber: "",
        applyDate: "",
        qualityGrade: "",
        pathologyCertified: null,
        nuclearMedicineCertified: null,
      });
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    // 모든 필수 필드 검증
    if (!formData.agencyName.trim()) {
      toastHelpers.error("기관명을 입력해주세요.");
      return;
    }
    if (!formData.medicalInstitutionNumber.trim()) {
      toastHelpers.error("요양기관번호를 입력해주세요.");
      return;
    }
    if (!formData.applyDate.trim()) {
      toastHelpers.error("적용일자를 입력해주세요.");
      return;
    }
    if (!formData.qualityGrade) {
      toastHelpers.error("질가산등급을 선택해주세요.");
      return;
    }
    if (!formData.pathologyCertified) {
      toastHelpers.error("병리검사 인증여부를 선택해주세요.");
      return;
    }
    if (!formData.nuclearMedicineCertified) {
      toastHelpers.error("핵의학 검사 인증여부를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Lab
      const lab = await onCreateLab({
        code: formData.medicalInstitutionNumber,
        name: formData.agencyName,
      });

      // 2. Create Grade
      await onCreateGrade({
        id: lab.id,
        data: {
          qualityGrade: Number(formData.qualityGrade),
          isPathologyCertified: formData.pathologyCertified?.value ?? false,
          isNuclearMedicineCertified: formData.nuclearMedicineCertified?.value ?? false,
          applyDate: formatDateToISO(formData.applyDate),
        }
      });

      toastHelpers.success("수탁기관이 등록되었습니다.");
      onOpenChange(false);
    } catch (error) {
      console.error("수탁기관 등록 실패:", error);
      toastHelpers.error("수탁기관 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모든 필드가 채워졌는지 확인
  const isFormValid = useMemo(() => {
    return (
      formData.agencyName.trim() !== "" &&
      formData.medicalInstitutionNumber.trim() !== "" &&
      formData.applyDate.trim() !== "" &&
      formData.qualityGrade !== "" &&
      formData.pathologyCertified !== null &&
      formData.nuclearMedicineCertified !== null
    );
  }, [formData]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <MyPopUp
      isOpen={open}
      onCloseAction={() => {
        if (!isSubmitting) handleCancel();
      }}
      title="수탁기관 추가"
      fitContent={true}
    >
      <div className="flex flex-col w-[600px]">
        <div className="flex flex-1 flex-col gap-[20px] p-[14px]">
          {/* 1열: 기관명 | 요양기관번호 */}
          <div className="flex gap-[12px]">
            <div className="flex flex-col flex-1 gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                기관명
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
                요양기관번호
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

          {/* 2열: 적용일자 | 질가산등급 | 병리검사 | 핵의학 검사 */}
          <div className="grid grid-cols-4 gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                적용일자
              </label>
              <div className="h-[40px]">
                <InputDate
                  value={formData.applyDate}
                  onChange={(value) =>
                    setFormData({ ...formData, applyDate: value })
                  }
                  className="w-full text-[13px] border-border rounded-[6px] focus-visible:ring-0 focus-visible:border-primary h-[40px] bg-background text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                질가산등급
              </label>
              <div className="relative">
                <select
                  className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors"
                  value={formData.qualityGrade || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, qualityGrade: e.target.value })
                  }
                  style={{
                    color: formData.qualityGrade ? "inherit" : "var(--muted-foreground)"
                  }}
                >
                  <option value="" disabled className="text-muted-foreground">선택하세요</option>
                  {QUALITY_GRADES.map((grade) => (
                    <option key={grade.value} value={String(grade.value)} className="text-foreground">
                      {grade.label}
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
            <div className="flex flex-col gap-[6px]">
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
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                핵의학 검사
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
        <div className="flex justify-end gap-[8px] p-[16px]">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px] cursor-pointer"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </MyPopUp>
  );
};

