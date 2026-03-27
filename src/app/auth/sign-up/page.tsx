"use client";

import { useState } from "react";
import { SignUpLeft } from "./_components/sign-up-left";
import { TermsForm } from "./components/terms-form";
import { SignUpForm } from "./components/sign-up-form";

export default function SignUpPage() {
  const [step, setStep] = useState<"terms" | "form">("terms");

  // 약관 동의 완료 후 다음 단계로 이동
  const handleTermsNext = () => {
    setStep("form");
  };

  // 폼에서 약관으로 돌아가기 (필요한 경우)
  const handleFormBack = () => {
    setStep("terms");
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Body */}
      <div className="flex items-start flex-1 self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col justify-center items-center gap-10 flex-1 self-stretch px-3">
          {step === "terms" ? (
            <TermsForm onNextAction={handleTermsNext} />
          ) : (
            <SignUpForm onBackAction={handleFormBack} />
          )}
        </div>
      </div>
    </div>
  );
}

