"use client";

import { Switch } from "@/components/settings/hospital-certificates/ui/switch";

type HiraPreCheckSectionProps = {
  isEnabled: boolean;
  onToggle: (checked: boolean) => void;
};

/**
 * HIRA 사전점검 사용 옵션 섹션
 * - 사용/미사용 스위치
 */
export function HiraPreCheckSection({
  isEnabled,
  onToggle,
}: HiraPreCheckSectionProps) {
  return (
    <div className="flex items-start justify-between bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label */}
      <div className="flex flex-col gap-2 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            HIRA 사전점검 사용
          </span>
        </div>
        <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
          청구 송신 시 HIRA 사전점검 서비스로 이동합니다.
        </p>
      </div>

      {/* Switch */}
      <div className="flex items-center py-1">
        <Switch checked={isEnabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}
