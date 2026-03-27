"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_AGENCY_CODE_LENGTH = 5;

type ProxyAgencySectionProps = {
  agencyName: string;
  agencyCode: string;
  onAgencyInfoChange: (
    field: "proxyAgencyName" | "proxyAgencyCode",
    value: string
  ) => void;
};

/**
 * 대행청구단체 섹션
 * - 대행업체명 / 대행업체기호(5자리) 입력
 * - 기본값 공란, 대행업체 이용 시에만 입력
 */
export function ProxyAgencySection({
  agencyName,
  agencyCode,
  onAgencyInfoChange,
}: ProxyAgencySectionProps) {
  const handleAgencyCodeChange = (value: string) => {
    onAgencyInfoChange("proxyAgencyCode", value.slice(0, MAX_AGENCY_CODE_LENGTH));
  };

  return (
    <div className="flex items-start justify-between bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label */}
      <div className="flex flex-col gap-1 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            대행청구단체
          </span>
        </div>
        <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
          청구 대행업체를 이용하는 경우 정보를 입력합니다.
        </p>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-4 w-[240px] shrink-0">
        <div className="flex flex-col gap-2">
          <Label className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
            대행업체명
          </Label>
          <Input
            type="text"
            value={agencyName}
            onChange={(e) =>
              onAgencyInfoChange("proxyAgencyName", e.target.value)
            }
            placeholder="업체명"
            className="h-8 rounded-[6px] border border-[var(--border-2)] bg-white px-2 text-[13px] font-pretendard tracking-[-0.13px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-100)]">
            대행업체기호
          </Label>
          <Input
            type="text"
            value={agencyCode}
            onChange={(e) => handleAgencyCodeChange(e.target.value)}
            placeholder="업체기호"
            maxLength={MAX_AGENCY_CODE_LENGTH}
            className="h-8 rounded-[6px] border border-[var(--border-2)] bg-white px-2 text-[13px] font-pretendard tracking-[-0.13px]"
          />
        </div>
      </div>
    </div>
  );
}
