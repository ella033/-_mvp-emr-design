"use client";
import { useState, FormEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetInvitation } from "@/hooks/invitations/use-get-invitation";
import Link from "next/link";
import { AuthAlert } from "@/app/auth/components/auth-alert";

interface LoginFormProps extends React.ComponentProps<"div"> {
  onLoginSuccessAction: (email: string, password: string) => void;
  isLoading?: boolean;
  alertMessage?: string;
  initialEmail?: string;
  isEmailDisabled?: boolean;
  hideSignUp?: boolean;
}

export function LoginForm({
  className,
  onLoginSuccessAction,
  isLoading,
  alertMessage,
  initialEmail,
  isEmailDisabled,
  hideSignUp = false,
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(false);
  const [isEmailFromInvitation, setIsEmailFromInvitation] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const { data: invitationData } = useGetInvitation(invitationId);

  // 초기 이메일 설정 (expiry 등)
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // 초대 링크 연결이 있는 경우 초대 이메일로 자동 설정
  useEffect(() => {
    if (invitationData?.invitedEmail) {
      setEmail(invitationData.invitedEmail);
      setIsEmailFromInvitation(true);
    } else {
      // 초대 링크 연결이 아니며, 초기 이메일(expiry)도 없는 경우 저장된 아이디 사용
      if (!initialEmail) {
        const savedLoginId = safeLocalStorage.getItem("savedLoginId");
        if (savedLoginId) {
          setEmail(savedLoginId);
          setSaveId(true);
        }
      }
    }
  }, [invitationData, initialEmail]);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onLoginSuccessAction(email, password);
  };

  return (
    <div className={cn("w-full max-w-md", className)} data-testid="login-form">
      {/* 제목 */}
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">로그인</h1>
      <p className="text-base text-[var(--gray-500)] mb-[11px]">
        이메일 계정으로 로그인해주세요
      </p>

      {/* 알림 메시지 (토큰 만료 등) */}
      {alertMessage && (
        <AuthAlert
          message={alertMessage}
          variant="error"
          className="mb-6"
        />
      )}

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4 mt-[24px]">
        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            아이디
          </label>
          <Input
            id="email"
            type="text"
            data-testid="login-email-input"
            placeholder="아이디(이메일)를 입력해주세요."
            value={email}
            onChange={(e) => {
              if (!isEmailFromInvitation && !isEmailDisabled) {
                setEmail(e.target.value);
              }
            }}
            disabled={isEmailFromInvitation || isEmailDisabled}
            required
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              (isEmailFromInvitation || isEmailDisabled) &&
              "bg-gray-100 cursor-not-allowed"
            )}
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            비밀번호
          </label>
          <InputPassword
            data-testid="login-password-input"
            placeholder="비밀번호를 입력해주세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 아이디 저장 */}
        {!isEmailDisabled && !isEmailFromInvitation && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="saveId"
              checked={saveId}
              onChange={(e) => setSaveId(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="saveId"
              className="ml-2 text-sm font-medium text-[var(--gray-300)]"
            >
              아이디 저장
            </label>
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button
          type="submit"
          data-testid="login-submit-button"
          disabled={!isFormValid || isLoading}
          className={cn(
            "w-full mt-5 py-2 text-base font-medium rounded-md transition-colors",
            isFormValid && !isLoading
              ? "text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
              : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
          )}
        >
          {isLoading ? "진행 중..." : "로그인"}
        </Button>

        {/* 회원가입 버튼 */}
        {!hideSignUp && (
          <Button
            type="button"
            variant="outline"
            data-testid="login-sign-up-button"
            className="w-full text-base border border-[var(--border-2)] text-[var(--gray-100)] rounded-md py-2 px-4"
            onClick={() => router.push("/auth/sign-up")}
          >
            회원가입
          </Button>
        )}

        {/* 하단 링크 */}
        <div className="flex items-center">
          <Link
            href="/auth/forgot-password"
            data-testid="login-forgot-password-link"
            className="text-sm text-[var(--gray-400)] transition-colors"
          >
            비밀번호 찾기
          </Link>
        </div>
      </form>
    </div>
  );
}
