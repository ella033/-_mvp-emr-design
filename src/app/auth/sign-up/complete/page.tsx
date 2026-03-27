// 회원가입 완료 페이지
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignUpLeft } from "../_components/sign-up-left";
import { cn } from "@/lib/utils";

const SignUpCompletePage = () => {
  return (
    <div className="flex min-h-screen bg-white" data-testid="sign-up-complete-page">
      {/* Body */}
      <div className="flex items-start flex-1 self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col justify-center items-center gap-10 flex-1 self-stretch px-3">
          <div className="w-full max-w-md">
            {/* 제목 */}
            <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2" data-testid="sign-up-complete-title">
              회원가입이 완료되었습니다!
            </h1>
            <p className="text-base text-[var(--gray-500)] mb-8">
              로그인 후 서비스를 이용하실 수 있습니다.
            </p>
            <Link href="/auth/sign-in">
              <Button
                type="button"
                data-testid="sign-up-complete-login-button"
                className={cn(
                  "w-full py-2 text-base font-medium text-white rounded-md transition-colors 'var(--main-color)' hover:'var(--main-color-hover)'"
                )}
              >
                로그인 페이지로 이동
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpCompletePage;
