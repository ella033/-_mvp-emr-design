"use client";

import { useState } from "react";
import { validatePasswordComplexity } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { InputPassword } from "@/components/ui/input-password";
import { AuthAlert } from "@/app/auth/components/auth-alert";

interface PasswordResetFormProps {
  onSubmit: (newPassword: string) => void;
  isSubmitting: boolean;
  alertMessage?: string;
  defaultAlertMessage?: string;
  serverError?: string;
}

export function PasswordResetForm({
  onSubmit,
  isSubmitting,
  alertMessage,
  defaultAlertMessage,
  serverError,
}: PasswordResetFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!newPassword || !confirmPassword) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8) {
      setError("영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요.");
      return;
    }

    // 영대문자, 영소문자, 숫자, 특수문자 중 3종류 이상 조합 체크
    if (!validatePasswordComplexity(newPassword)) {
      setError("영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요.");
      return;
    }

    setError("");
    onSubmit(newPassword);
  };

  return (
    <div className="flex flex-col w-[360px]" data-testid="auth-password-reset-form">
      <div className="space-y-[11px] text-center sm:text-left">
        <div className="text-[22px] font-bold leading-[1.4] tracking-[-0.22px] text-[#171719] [font-feature-settings:'case'_on,'cpsp'_on]">
          비밀번호 재설정
        </div>
        <p className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#989BA2]">
          기존과 동일하지 않은 새로운 비밀번호로 변경해주세요.
        </p>
      </div>

      {(alertMessage || defaultAlertMessage) && (
        <AuthAlert
          message={(alertMessage || defaultAlertMessage)!}
          variant="info"
          className="mt-[11px]"
        />
      )}

      <div className="grid">
        <div className="mb-[24px]"></div>
        <div className="grid">
          <Label
            htmlFor="new-password"
            className="text-[13px] font-normal leading-[1.25] tracking-[-0.13px] text-[#171719]"
          >
            새 비밀번호 <span className="text-destructive">*</span>
          </Label>
          <div className="mb-[8px]"></div>
          <InputPassword
            id="new-password"
            data-testid="auth-password-reset-new-password-input"
            placeholder="영문대/소문자, 숫자, 특수문자 조합 8자리 이상"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-[16px]"></div>
        <div className="grid">
          <Label
            htmlFor="confirm-password"
            className="text-[13px] font-normal leading-[1.25] tracking-[-0.13px] text-[#171719]"
          >
            새 비밀번호 확인 <span className="text-destructive">*</span>
          </Label>
          <div className="mb-[8px]"></div>
          <InputPassword
            id="confirm-password"
            data-testid="auth-password-reset-confirm-password-input"
            placeholder="영문대/소문자, 숫자, 특수문자 조합 8자리 이상"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {(error || serverError) && (
          <div
            className="flex items-center mt-2 gap-1 text-[13px] text-[#DC2626]"
            data-testid="auth-password-reset-error"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 shrink-0"
            >
              <g clipPath="url(#clip0_2618_17622)">
                <path
                  d="M7.5 15C11.6421 15 15 11.6421 15 7.5C15 3.35786 11.6421 0 7.5 0C3.35786 0 0 3.35786 0 7.5C0 11.6421 3.35786 15 7.5 15Z"
                  fill="#FF5252"
                />
                <path
                  d="M4.5 4.5L10.5 10.5"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.5 4.5L4.5 10.5"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_2618_17622">
                  <rect width="15" height="15" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span>{error || serverError}</span>
          </div>
        )}
      </div>

      <div className="mb-[24px]"></div>
      <Button
        data-testid="auth-password-reset-submit-button"
        className={cn(
          "w-full mt-5 py-2 text-base font-medium rounded-md transition-colors",
          !isSubmitting
            ? "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
            : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
        )}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "변경 중..." : "확인"}
      </Button>
    </div >
  );
}
