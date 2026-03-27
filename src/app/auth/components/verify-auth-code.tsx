"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyAuthCodeProps {
  loginId: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  isVerifying: boolean;
  title?: string;
  errorMessage?: string; // External error (mismatch, etc.)
}

export function VerifyAuthCode({
  loginId,
  onVerify,
  onResend,
  isVerifying,
  title = "계정 잠금 해제",
  errorMessage,
}: VerifyAuthCodeProps) {
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(60);
  const [hasResent, setHasResent] = useState(false);

  const isExpired = timeLeft === 0;

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const handleResend = () => {
    setTimeLeft(600);
    setResendCooldown(60);
    setCode("");
    setHasResent(true);
    onResend();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Upper case, AlphaNumeric only, No space, Max 6
    const val = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .trim()
      .slice(0, 6);
    setCode(val);
  };

  // Border red if Expired OR has Error
  const isErrorState = isExpired || !!errorMessage;
  // Timer red if <= 180s (3 mins) or Expired
  const isTimerRed = timeLeft <= 180;

  return (
    <div className="flex flex-col w-[360px]" data-testid="auth-verify-code-form">
      <div className="space-y-[11px] text-center sm:text-left">
        <div className="text-[22px] font-bold leading-[1.4] tracking-[-0.22px] text-[#171719] [font-feature-settings:'case'_on,'cpsp'_on]">
          {title}
        </div>
        <p className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#989BA2]">
          <span className="font-semibold">{loginId}</span>으로 발송된 인증 코드를
          입력해주세요.
        </p>
      </div>

      <div className="grid">
        <div className="mb-[24px]"></div>
        <Label
          htmlFor="code"
          className="text-[13px] font-normal leading-[1.25] tracking-[-0.13px] text-[#171719]"
        >
          인증 코드
        </Label>
        <div className="mb-[8px]"></div>
        <div className="relative">
          <Input
            id="code"
            data-testid="auth-verify-code-input"
            placeholder="인증 코드 6자리를 입력해주세요"
            value={code}
            onChange={handleInputChange}
            disabled={isVerifying || isExpired}
            className={`rounded-[6px] border bg-white pr-16 ${isErrorState
              ? "border-[#FF453A] text-[#FF453A]"
              : "border-[#C2C4C8]"
              }`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span
              className={`text-sm font-medium ${isTimerRed ? "text-[#FF453A]" : "text-gray-900"
                }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Success Message (Resent) */}
        {hasResent && !isErrorState && (
          <div
            className="flex items-center gap-1 mt-2 text-[#22C55E] text-[13px] font-normal leading-[1.25] tracking-[-0.13px]"
            data-testid="auth-verify-code-success"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
              <path d="M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM10.4999 5.49972L6.99991 8.99972L4.99991 6.99972" fill="#22C55E" />
              <path d="M4.99991 6.99972L6.99991 8.99972L10.4999 5.49972" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>인증 코드를 다시 발송했습니다.</span>
          </div>
        )}

        {/* Error Message Area */}
        {isErrorState && (
          <div
            className="flex items-center gap-1 mt-2 text-[#FF453A] text-[13px] font-normal leading-[1.25] tracking-[-0.13px]"
            data-testid="auth-verify-code-error"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
            >
              <path
                d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8.24992 4.49972C8.24992 4.91393 7.91413 5.24972 7.49992 5.24972C7.08571 5.24972 6.74992 4.91393 6.74992 4.49972C6.74992 4.08551 7.08571 3.74972 7.49992 3.74972C7.91413 3.74972 8.24992 4.08551 8.24992 4.49972ZM7.49992 5.99972C7.91413 5.99972 8.24992 6.33551 8.24992 6.74972V10.4997C8.24992 10.9139 7.91413 11.2497 7.49992 11.2497C7.08571 11.2497 6.74992 10.9139 6.74992 10.4997V6.74972C6.74992 6.33551 7.08571 5.99972 7.49992 5.99972Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
            <span>
              {isExpired
                ? "인증 코드가 만료되었습니다. 인증 코드를 다시 받아주세요."
                : errorMessage}
            </span>
          </div>
        )}
      </div>

      <div className="mb-[40px]"></div>
      <div className="flex flex-col gap-[10px]">
        <Button
          data-testid="auth-verify-code-submit-button"
          className={cn(
            "w-full py-2 text-base font-medium rounded-[4px] transition-colors",
            !isVerifying && code.length === 6 && !isExpired
              ? "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
              : "text-[var(--gray-500)] bg-[#EAEBEC] border border-[#C2C4C8] cursor-not-allowed"
          )}
          onClick={() => onVerify(code)}
          disabled={isVerifying || code.length !== 6 || isExpired}
        >
          {isVerifying ? "인증 중..." : "다음"}
        </Button>
        <Button
          data-testid="auth-verify-code-resend-button"
          className={cn(
            "w-full py-2 text-base font-medium rounded-[4px] transition-colors",
            !(isVerifying || (!isExpired && resendCooldown > 0))
              ? "bg-white text-[#180F38] border border-[#180F38] hover:bg-gray-50"
              : "text-[var(--gray-500)] bg-[#EAEBEC] border border-[#C2C4C8] cursor-not-allowed"
          )}
          onClick={handleResend}
          disabled={isVerifying || (!isExpired && resendCooldown > 0)}
        >
          {!isExpired && resendCooldown > 0
            ? `${resendCooldown}초 후 재발송 할 수 있습니다.`
            : "인증 코드 재발송"}
        </Button>
      </div>

      <div className="text-center mt-3">
        <span className="text-[13px] text-[#171719] tracking-[-0.13px]">
          인증 코드를 받지 못하셨나요?{" "}
          <button className="text-[#6B4BFB] underline font-medium" onClick={() => alert("고객센터로 문의해주세요.")}>
            고객센터 문의
          </button>
        </span>
      </div>
    </div>
  );
}
