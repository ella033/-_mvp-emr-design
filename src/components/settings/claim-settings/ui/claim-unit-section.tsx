"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ClaimUnitType } from "../model";

type ClaimUnitSectionProps = {
  claimUnit: ClaimUnitType;
  onClaimUnitChange: (unit: ClaimUnitType) => void;
};

/**
 * 청구 단위 설정 섹션
 * - 월단위 / 주단위 라디오 버튼 (동시 선택 불가)
 */
export function ClaimUnitSection({
  claimUnit,
  onClaimUnitChange,
}: ClaimUnitSectionProps) {
  return (
    <div className="flex items-start justify-between bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label */}
      <div className="flex flex-col gap-2 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            청구단위
          </span>
        </div>
        <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
          당월의 청구 단위가 상이한 경우 지급불능 처리되므로 다음달이 되기
          전까지 동일한 단위로 청구해야 합니다.
        </p>
      </div>

      {/* Radio Options */}
      <div className="flex items-center gap-4 py-1">
        <Label className="flex items-center gap-1.5 cursor-pointer">
          <Input
            type="radio"
            name="claimUnit"
            checked={claimUnit === "monthly"}
            onChange={() => onClaimUnitChange("monthly")}
          />
          <span className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-300)]">
            월단위
          </span>
        </Label>

        <Label className="flex items-center gap-1.5 cursor-pointer">
          <Input
            type="radio"
            name="claimUnit"
            checked={claimUnit === "weekly"}
            onChange={() => onClaimUnitChange("weekly")}
          />
          <span className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-300)]">
            주단위
          </span>
        </Label>
      </div>
    </div>
  );
}
