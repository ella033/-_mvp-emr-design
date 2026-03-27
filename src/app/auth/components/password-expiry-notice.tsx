"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PasswordExpiryNoticeProps {
  message: string;
  onChangePassword: () => void;
}

export function PasswordExpiryNotice({
  message,
  onChangePassword,
}: PasswordExpiryNoticeProps) {
  return (
    <div className="flex flex-col w-[360px]">
      <div className="space-y-[11px] text-center sm:text-left">
        <div className="text-[22px] font-bold leading-[1.4] tracking-[-0.22px] text-[#171719] [font-feature-settings:'case'_on,'cpsp'_on]">
          비밀번호를 변경해주세요
        </div>
        <p className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#989BA2] whitespace-pre-wrap">
          {message}
        </p>
      </div>
      <div className="mb-[24px]"></div>
      <Button
        className={cn(
          "w-full mt-5 py-2 text-base font-medium rounded-md transition-colors",
          "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
        )}
        onClick={onChangePassword}
      >
        비밀번호 변경하기
      </Button>
    </div>
  );
}
