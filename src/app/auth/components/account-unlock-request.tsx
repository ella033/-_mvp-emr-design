"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAlert } from "@/app/auth/components/auth-alert";

interface AccountUnlockRequestProps {
  defaultLoginId?: string;
  onSendCode: (loginId: string) => void;
  isLoading: boolean;
  alertMessage?: string;
  title?: string;
}

export function AccountUnlockRequest({
  defaultLoginId = "",
  onSendCode,
  isLoading,
  alertMessage,
  title = "계정 잠금 해제",
}: AccountUnlockRequestProps) {
  const [loginId, setLoginId] = useState(defaultLoginId);

  return (
    <div className="flex flex-col w-[360px]">
      <div className="space-y-[11px] text-center sm:text-left">
        <div className="text-[22px] font-bold leading-[1.4] tracking-[-0.22px] text-[#171719] [font-feature-settings:'case'_on,'cpsp'_on]">
          {title}
        </div>
        <p className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#989BA2]">
          이메일 인증을 통해 잠금을 해제하세요.
        </p>
      </div>


      {alertMessage && (
        <AuthAlert
          message={alertMessage}
          variant="error"
          className="mt-[11px]"
        />
      )}

      <div className="grid">
        <div className="mb-[24px]"></div>
        <Label
          htmlFor="loginId"
          className="text-[13px] font-normal leading-[1.25] tracking-[-0.13px] text-[#171719]"
        >
          아이디
        </Label>
        <div className="mb-[8px]"></div>
        <Input
          id="loginId"
          value={loginId}
          disabled={true}
          className="rounded-[6px] border border-[#C2C4C8] bg-[#EAEBEC]"
        />
      </div>
      <div className="mb-[24px]"></div>
      <Button
        className={cn(
          "w-full mt-5 py-2 text-base font-medium rounded-md transition-colors",
          loginId && !isLoading
            ? "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
            : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
        )}
        onClick={() => onSendCode(loginId)}
        disabled={isLoading || !loginId}
      >
        {isLoading ? "전송 중..." : "인증코드 보내기"}
      </Button>
    </div>
  );
}
