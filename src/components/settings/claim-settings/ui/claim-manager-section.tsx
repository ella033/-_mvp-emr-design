"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_MANAGER_NAME_LENGTH = 20;
const MAX_BIRTH_DATE_LENGTH = 13;

/** 생년월일: 숫자만 허용, 최대 13자 */
function sanitizeBirthDate(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.slice(0, MAX_BIRTH_DATE_LENGTH);
}

type ClaimManagerSectionProps = {
  managerName: string;
  managerBirthDate: string;
  onManagerInfoChange: (
    field: "claimManagerName" | "claimManagerBirthDate",
    value: string
  ) => void;
};

/**
 * 청구 담당자 설정 섹션
 * - 담당자 성명(최대 20자) / 생년월일(숫자만 최대 13자)
 */
export function ClaimManagerSection({
  managerName,
  managerBirthDate,
  onManagerInfoChange,
}: ClaimManagerSectionProps) {
  const handleManagerNameChange = (value: string) => {
    onManagerInfoChange("claimManagerName", value.slice(0, MAX_MANAGER_NAME_LENGTH));
  };

  const handleBirthDateChange = (value: string) => {
    onManagerInfoChange("claimManagerBirthDate", sanitizeBirthDate(value));
  };

  return (
    <div className="flex items-start justify-between bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label */}
      <div className="flex flex-col gap-1 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            청구 담당자
          </span>
        </div>
        <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
          청구서에 기재 될 담당자를 지정합니다.
        </p>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4 w-[240px] shrink-0">
        <div className="flex flex-col gap-2">
          <Label className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
            청구담당자
          </Label>
          <Input
            type="text"
            value={managerName}
            onChange={(e) => handleManagerNameChange(e.target.value)}
            placeholder="김청구"
            maxLength={MAX_MANAGER_NAME_LENGTH}
            className="h-8 rounded-[6px] border border-[var(--border-2)] bg-white px-2 text-[13px] font-pretendard tracking-[-0.13px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
            담당자 생년월일
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={managerBirthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            placeholder="19960706"
            maxLength={MAX_BIRTH_DATE_LENGTH}
            className="h-8 rounded-[6px] border border-[var(--border-2)] bg-white px-2 text-[13px] font-pretendard tracking-[-0.13px]"
          />
        </div>
      </div>
    </div>
  );
}
