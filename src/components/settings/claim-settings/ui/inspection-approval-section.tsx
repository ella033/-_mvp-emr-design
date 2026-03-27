"use client";

type InspectionApprovalSectionProps = {
  approvalNumber: string;
};

/**
 * 검사승인번호 섹션
 * - 읽기 전용 필드로 청구소프트웨어 인증번호 표시
 * - 별도 수정 불가
 */
export function InspectionApprovalSection({
  approvalNumber,
}: InspectionApprovalSectionProps) {
  return (
    <div className="flex items-end gap-6 bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label */}
      <div className="flex flex-col gap-1 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            검사승인번호
          </span>
        </div>
        <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
          청구소프트웨어 인증번호를 조회합니다.
        </p>
      </div>

      {/* Read-only field */}
      <div className="flex-1">
        <div className="h-8 flex items-center px-2 rounded-[6px] border border-[var(--border-2)] bg-[var(--bg-3)] font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
          {approvalNumber || "-"}
        </div>
      </div>
    </div>
  );
}
