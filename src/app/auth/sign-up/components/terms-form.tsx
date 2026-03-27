"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import MyCheckbox from "@/components/yjg/my-checkbox";
import Image from "next/image";
import { useTermsAgreeStore } from "@/store/terms-agree-store";

interface TermsFormProps {
  onNextAction: () => void;
}

export function TermsForm({ onNextAction }: TermsFormProps) {
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  const { setTermsAgreement, terms, privacy } = useTermsAgreeStore();

  useEffect(() => {
    setAgreements((prev) => ({
      ...prev,
      terms,
      privacy,
      all: terms && privacy,
    }));
  }, [terms, privacy]);

  // 전체 동의 체크박스 핸들러
  const handleAllAgreementChange = (checked: boolean) => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  // 개별 체크박스 핸들러 체크박스
  const handleAgreementChange = (
    field: keyof typeof agreements,
    checked: boolean
  ) => {
    const newAgreements = { ...agreements, [field]: checked };

    // 개별 체크박스가 변경될 때 전체 동의 상태 업데이트
    if (field !== "all") {
      newAgreements.all =
        newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
    }

    setAgreements(newAgreements);
  };

  // 모든 필수 약관에 동의했는지 확인
  // TODO: 약관 동의는 UI만 존재, 약관 동의 처리 등은 향후 구현 예정
  const isAllRequiredAgreed = agreements.terms && agreements.privacy;

  const handleSubmit = () => {
    if (isAllRequiredAgreed) {
      // 약관 동의 상태 저장
      setTermsAgreement(agreements.terms, agreements.privacy);
      onNextAction();
    }
  };

  return (
    <div className="w-full max-w-md" data-testid="sign-up-terms-form">
      {/* 제목 */}
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">
        회원가입
      </h1>
      <p className="text-base text-[var(--gray-500)] mb-8">
        EMR 서비스의 사용을 위해 필수 약관 동의가 필요합니다.
      </p>

      {/* 약관 동의 폼 */}
      <div className="space-y-4">
        {/* 전체 동의 */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <MyCheckbox
              id="all"
              data-testid="sign-up-all-agree-checkbox"
              checked={agreements.all}
              onChange={handleAllAgreementChange}
              className="h-5 w-5"
            />
            <label
              htmlFor="all"
              className="text-base text-[var(--gray-300)] cursor-pointer"
            >
              전체 동의
            </label>
          </div>
        </div>

        {/* 개별 약관들 */}
        <div className="space-y-4">
          {/* 이용약관 */}
          <div className="flex items-start space-x-3">
            <MyCheckbox
              id="terms"
              data-testid="sign-up-terms-checkbox"
              checked={agreements.terms}
              onChange={(checked) =>
                handleAgreementChange("terms", checked as boolean)
              }
              className="h-5 w-5 mt-0.5"
            />
            <div className="flex-1 flex items-center justify-between">
              <label
                htmlFor="terms"
                className="text-base text-[var(--gray-300)] cursor-pointer"
              >
                (필수) 서비스 이용약관 동의
              </label>
              <button
                type="button"
                className="flex items-center space-x-1 text-base text-[var(--gray-500)] cursor-pointer"
                onClick={() => {
                  alert("서비스 이용약관은 준비 중입니다.");
                }}
              >
                <span>약관보기</span>
                <Image
                  src="/icon/ic_line_arrow_right.svg"
                  alt="화살표"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              </button>
            </div>
          </div>

          {/* 개인정보 처리방침 */}
          <div className="flex items-start space-x-3">
            <MyCheckbox
              id="privacy"
              data-testid="sign-up-privacy-checkbox"
              checked={agreements.privacy}
              onChange={(checked) =>
                handleAgreementChange("privacy", checked as boolean)
              }
              className="h-5 w-5 mt-0.5"
            />
            <div className="flex-1 flex items-center justify-between">
              <label
                htmlFor="privacy"
                className="text-base text-[var(--gray-300)] cursor-pointer"
              >
                (필수) 개인정보 수집 및 이용 동의
              </label>
              <button
                type="button"
                className="flex items-center space-x-1 text-base text-[var(--gray-500)] cursor-pointer"
                onClick={() => {
                  alert(
                    "개인정보 수집 및 이용 동의 약관은 준비 중입니다."
                  );
                }}
              >
                <span>약관보기</span>
                <Image
                  src="/icon/ic_line_arrow_right.svg"
                  alt="화살표"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              </button>
            </div>
          </div>
        </div>

        {/* 다음 버튼 */}
        <Button
          type="button"
          onClick={handleSubmit}
          data-testid="sign-up-terms-next-button"
          disabled={!isAllRequiredAgreed}
          className={cn(
            "w-full mt-5 py-2 text-base font-medium text-white rounded-md transition-colors",
            isAllRequiredAgreed
              ? "bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
              : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
          )}
        >
          다음
        </Button>

        {/* 상담하기 링크 */}
        <div className="text-center mt-4">
          <span className="text-sm text-[var(--gray-400)] transition-colors">
            궁금한 사항이 있으신가요?{" "}
            <button
              type="button"
              className="text-sm text-[var(--second-color)] underline cursor-pointer transition-colors"
              onClick={() => {
                alert("상담하기는 준비 중입니다.");
              }}
            >
              상담하기
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
