"use client";

import { useRouter } from "next/navigation";
import { SignUpLeft } from "@/app/auth/sign-up/_components/sign-up-left";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InviteCompleted() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push("/auth/sign-in");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Body */}
      <div className="flex items-start flex-1 self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col justify-center items-center gap-10 flex-1 self-stretch px-3">
          <div className="w-full max-w-md">
            {/* 제목 */}
            <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-6 text-left">
              초대 링크가 만료되었습니다.
            </h1>

            {/* 설명 텍스트 */}
            <div className="mb-8">
              <p className="text-base text-[var(--gray-500)] text-left">
                초대 링크는 발송일로부터{" "}
                <span className="text-red-500 font-semibold">30일간 유효</span>
                합니다.
              </p>
              <p className="text-base text-[var(--gray-500)] text-left">
                링크가 만료되어 병원 접속 권한을 부여받을 수 없습니다.
              </p>
              <p className="text-base text-[var(--gray-500)] text-left mt-5">
                병원 관리자에게 초대 링크를 다시 요청해주세요.
              </p>
            </div>

            {/* 메인 홈페이지로 이동 버튼 */}
            <Button
              type="button"
              onClick={handleGoToLogin}
              className={cn(
                "w-full py-2 text-base text-white rounded-md transition-colors",
                "bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
              )}
            >
              메인 홈페이지로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
