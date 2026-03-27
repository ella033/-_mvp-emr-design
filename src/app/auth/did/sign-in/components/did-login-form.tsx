"use client";
import { useState, FormEvent, useEffect } from "react";
import { cn } from "@/lib/utils";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
import { AuthAlert } from "@/app/auth/components/auth-alert";
import Link from "next/link";

interface DIDLoginFormProps extends React.ComponentProps<"div"> {
  onLoginSuccessAction: (email: string, password: string) => void;
  isLoading?: boolean;
  alertMessage?: string;
  initialEmail?: string;
  isEmailDisabled?: boolean;
}

export function DIDLoginForm({
  className,
  onLoginSuccessAction,
  isLoading,
  alertMessage,
  initialEmail,
  isEmailDisabled,
}: DIDLoginFormProps) {
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (!initialEmail) {
      const savedLoginId = safeLocalStorage.getItem("savedLoginId_did");
      if (savedLoginId) {
        setEmail(savedLoginId);
        setSaveId(true);
      }
    }
  }, [initialEmail]);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saveId) {
      safeLocalStorage.setItem("savedLoginId_did", email);
    } else {
      safeLocalStorage.removeItem("savedLoginId_did");
    }
    onLoginSuccessAction(email, password);
  };

  return (
    <div className={cn("w-full max-w-md", className)}>
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">환자 대기 화면 로그인</h1>
      <p className="text-base text-[var(--gray-500)] mb-[11px]">
        이메일 계정으로 로그인해주세요
      </p>

      {alertMessage && (
        <AuthAlert
          message={alertMessage}
          variant="error"
          className="mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-[24px]">
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            아이디
          </label>
          <Input
            id="email"
            type="text"
            placeholder="아이디(이메일)를 입력해주세요."
            value={email}
            onChange={(e) => {
              if (!isEmailDisabled) {
                setEmail(e.target.value);
              }
            }}
            disabled={isEmailDisabled}
            required
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              isEmailDisabled && "bg-gray-100 cursor-not-allowed"
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            비밀번호
          </label>
          <InputPassword
            placeholder="비밀번호를 입력해주세요."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {!isEmailDisabled && (
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

        <Button
          type="submit"
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

        <div className="flex items-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-[var(--gray-400)] transition-colors"
          >
            비밀번호 찾기
          </Link>
        </div>
      </form>

      {/* 브라우저 설정 안내 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          DID 화면 사용을 위한 브라우저 설정
        </p>
        <ul className="text-xs text-gray-500 space-y-2">
          <li>
            <span className="font-medium text-gray-600">1. 팝업 허용:</span>{" "}
            주소창 좌측 자물쇠 아이콘 &gt; 사이트 설정 &gt; 팝업 &gt; 허용
          </li>
          <li>
            <span className="font-medium text-gray-600">2. 소리 허용 (호출 음성 안내):</span>{" "}
            브라우저 설정 &gt; 사이트 권한 &gt; 소리(자동 재생) &gt; 현재 사이트 URL을 허용 목록에 추가
          </li>
          <li>
            <span className="font-medium text-gray-600">2-1. 보조 경로:</span>{" "}
            소리 항목이 안 보이면 사이트 설정 &gt; 추가 콘텐츠 &gt; 소리에서 허용
            <br />
            (Chrome/Edge 등 브라우저 버전에 따라 메뉴 위치가 다를 수 있습니다.)
          </li>
          <li>
            <span className="font-medium text-gray-600">3. 창 관리 허용:</span>{" "}
            로그인 시 &quot;화면 배치 권한&quot; 팝업이 뜨면 허용 (DID 모니터에 자동 배치)
          </li>
        </ul>
      </div>
    </div>
  );
}
