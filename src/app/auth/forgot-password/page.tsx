"use client";

import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignUpLeft } from "@/app/auth/sign-up/_components/sign-up-left";
import { VerifyAuthCode } from "@/app/auth/components/verify-auth-code";
import { PasswordResetForm } from "@/app/auth/components/password-reset-form";
import {
  useRequestPasswordResetToken,
  useVerifyUnlockToken,
  useResetPasswordWithToken,
} from "@/hooks/auth/use-unlock-account";
import { useRouter } from "next/navigation";
import { useToastHelpers } from "@/components/ui/toast";

type Step = "email" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");

  const { success } = useToastHelpers();

  // React Query Hooks
  const { mutate: requestToken, isPending: isRequesting } = useRequestPasswordResetToken({
    onSuccess: () => {
      setError("");
      setStep("verify");
    },
    onError: (e) => setError(e.message),
  });

  const { mutate: verifyToken, isPending: isVerifying } = useVerifyUnlockToken({
    onSuccess: (data) => {
      if (data.isValid && data.code === "SUCCESS") {
        setStep("reset");
      } else {
        setError("인증 코드가 유효하지 않습니다.");
      }
    },
    onError: (e) => setError(e.message),
  });

  const { mutate: resetPassword, isPending: isResetting } = useResetPasswordWithToken({
    onSuccess: () => {
      success("비밀번호 변경 완료", "비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.");
      router.push("/auth/sign-in");
    },
    onError: (e) => setError(e.message),
  });

  const router = useRouter();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmitEmail = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      setError("올바른 이메일 형식을 입력해 주세요");
      return;
    }

    requestToken({ loginId: email });
  };

  const handleVerifyCode = (code: string) => {
    setError("");
    setVerifiedToken(code);
    verifyToken({ loginId: email, token: code });
  };

  const handleResendCode = () => {
    setError("");
    requestToken({ loginId: email });
  };

  const handleResetPassword = (newPassword: string) => {
    setError("");
    resetPassword({
      loginId: email,
      token: verifiedToken,
      newPassword,
    });
  };

  return (
    <div className="flex min-h-screen bg-white" data-testid="forgot-password-page">
      {/* Body */}
      <div className="flex flex-1 items-start self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 - 이미지 영역 재사용 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col flex-1 gap-10 justify-center items-center self-stretch px-3">
          <div className="flex flex-col w-[360px]">
            {step === "email" && (
              <>
                {/* 헤더 영역 */}
                <div className="w-full flex flex-col space-y-[11px] mb-[24px]">
                  <h1 className="text-[22px] font-bold leading-[1.4] tracking-[-0.22px] text-[#171719] [font-feature-settings:'case'_on,'cpsp'_on]">
                    비밀번호 찾기
                  </h1>
                  <p className="text-[14px] font-medium leading-[1.25] tracking-[-0.14px] text-[#989BA2]">
                    이메일 인증 후 비밀번호를 재설정 할 수 있습니다.
                  </p>
                </div>

                {/* 폼 영역 */}
                <form onSubmit={handleSubmitEmail} className="w-full flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="email"
                      className="text-[13px] font-normal leading-[1.25] tracking-[-0.13px] text-[#171719]"
                    >
                      아이디
                    </label>
                    <div className="mb-[8px]"></div>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        data-testid="forgot-password-email-input"
                        placeholder="아이디(이메일)를 입력해주세요."
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        onBlur={() => {
                          if (email && !validateEmail(email)) {
                            setError("올바른 이메일 형식을 입력해 주세요");
                          }
                        }}
                        className={cn(
                          "rounded-[6px] border bg-white text-[15px] placeholder:text-[#C4C5C9] focus-visible:ring-0",
                          error ? "border-[#FF453A] text-[#FF453A]" : "border-[#C2C4C8]"
                        )}
                        disabled={isRequesting}
                      />
                      {error && (
                        <div
                          className="flex items-center gap-1 mt-2 text-[#FF453A] text-[13px] font-normal leading-[1.25] tracking-[-0.13px]"
                          data-testid="forgot-password-error"
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
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      data-testid="forgot-password-send-button"
                      className={cn(
                        "w-full mt-5 py-2 text-base font-medium rounded-md transition-colors",
                        !isRequesting && validateEmail(email)
                          ? "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
                          : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
                      )}
                      disabled={!validateEmail(email) || isRequesting}
                    >
                      {isRequesting ? "전송 중..." : "인증코드 보내기"}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {step === "verify" && (
              <VerifyAuthCode
                loginId={email}
                onVerify={handleVerifyCode}
                onResend={handleResendCode}
                isVerifying={isVerifying}
                title="비밀번호 찾기"
                errorMessage={error}
              />
            )}

            {step === "reset" && (
              <PasswordResetForm
                onSubmit={handleResetPassword}
                isSubmitting={isResetting}
                alertMessage=""
                serverError={error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
