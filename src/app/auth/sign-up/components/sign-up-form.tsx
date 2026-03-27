"use client";

import { useState, FormEvent, useEffect } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateUser } from "@/hooks/user/use-create-user";
import { useTermsAgreeStore } from "@/store/terms-agree-store";
import { useGetInvitation } from "@/hooks/invitations/use-get-invitation";
import { validatePasswordComplexity } from "@/lib/validation";

interface SignUpFormProps {
  onBackAction?: () => void;
}

export function SignUpForm({ onBackAction }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isEmailFromInvitation, setIsEmailFromInvitation] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");
  const { mutateAsync: createUser } = useCreateUser();
  const { isAllRequiredAgreed } = useTermsAgreeStore();
  const { data: invitationData } = useGetInvitation(invitationId);

  // 페이지 로딩 시 약관 동의 상태 확인
  useEffect(() => {
    if (!isAllRequiredAgreed()) {
      alert("필수 약관 동의를 진행해주세요.");
      if (onBackAction) {
        onBackAction();
      }
    }
  }, [isAllRequiredAgreed, onBackAction]);

  // 초대장 이메일 자동 설정
  useEffect(() => {
    if (invitationData?.invitedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: invitationData.invitedEmail,
      }));
      setIsEmailFromInvitation(true);
    }
  }, [invitationData]);

  // 기본 스키마 정의 (공통으로 사용)
  const baseSchema = z.object({
    name: z.string().nonempty("이름을 입력해주세요."),
    email: z
      .string()
      .nonempty("이메일을 입력해주세요.")
      .email("올바른 이메일 형식으로 작성해주세요."),
    password: z
      .string()
      .nonempty("비밀번호를 입력해주세요.")
      .min(8, "영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요.")
      .refine((password) => {
        return validatePasswordComplexity(password);
      }, "영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요."),
    confirmPassword: z.string().nonempty("비밀번호 확인을 입력해주세요."),
  });

  // 전체 폼 validation을 위한 스키마 (비밀번호 일치 체크 포함)
  const signUpSchema = baseSchema.refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "비밀번호가 일치하지 않습니다.",
      path: ["confirmPassword"],
    }
  );

  // 개별 필드 validation 함수
  const validateField = (field: string, value: string) => {
    const fieldSchema =
      baseSchema.shape[field as keyof typeof baseSchema.shape];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      if (!result.success) {
        return result.error.errors[0]?.message || "";
      }
    }
    return "";
  };

  // 전체 폼 validation 함수
  const validateForm = () => {
    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsFormValid(false);
      return false;
    }
    setErrors({});
    setIsFormValid(true);
    return true;
  };

  // 폼 데이터 변경 시 전체 validation 체크
  const checkFormValidity = () => {
    const result = signUpSchema.safeParse(formData);
    setIsFormValid(result.success);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 초대링크를 통해 들어온 경우 invitationId를 파라메터로 전달
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        type: 1, // TODO: 사용자 타입 의사로 설정
        isActive: true, // 기본 활성화 상태
        ...(invitationId && { invitationId }),
      });
      router.push("/auth/sign-up/complete");
    } catch (error: any) {
      alert(error?.message || "회원가입 진행 중 오류가 발생하였습니다.");
      throw error;
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    // 초대장으로 설정된 이메일은 변경 불가
    if (field === "email" && isEmailFromInvitation) {
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 에러 메시지 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    // 폼 유효성 체크
    checkFormValidity();
  };

  const handleBlur = (field: string) => {
    const value = formData[field as keyof typeof formData] as string;
    const errorMessage = validateField(field, value);

    // 비밀번호 확인 필드의 경우 비밀번호와 일치하는지도 체크
    if (field === "confirmPassword" && value && formData.password) {
      if (value !== formData.password) {
        setErrors((prev) => ({
          ...prev,
          [field]: "비밀번호가 일치하지 않습니다.",
        }));
        return;
      }
    }

    setErrors((prev) => ({ ...prev, [field]: errorMessage }));
    checkFormValidity();
  };

  return (
    <div className="w-full max-w-md" data-testid="sign-up-form">
      {/* 제목 */}
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">
        회원가입
      </h1>
      <p className="text-base text-[var(--gray-500)] mb-8">
        사용하실 아이디와 비밀번호를 설정해주세요.
      </p>

      {/* 회원정보 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            이름 <span className="text-[var(--negative)]">*</span>
          </label>
          <Input
            type="text"
            data-testid="sign-up-name-input"
            placeholder="이름을 입력해주세요."
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.name &&
              "border-[var(--negative)] focus:ring-[var(--negative)]"
            )}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-[var(--negative)]">{errors.name}</p>
          )}
        </div>

        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            아이디 <span className="text-[var(--negative)]">*</span>
          </label>
          <Input
            id="email"
            type="email"
            data-testid="sign-up-email-input"
            placeholder="아이디(이메일)을 입력해주세요."
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            disabled={isEmailFromInvitation}
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.email &&
              "border-[var(--negative)] focus:ring-[var(--negative)]",
              isEmailFromInvitation && "bg-gray-100 cursor-not-allowed"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-[var(--negative)]">
              {errors.email}
            </p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            비밀번호 <span className="text-[var(--negative)]">*</span>
          </label>
          <InputPassword
            data-testid="sign-up-password-input"
            placeholder="비밀번호를 입력해주세요."
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.password &&
              "border-[var(--negative)] focus:ring-[var(--negative)]"
            )}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-[var(--negative)]">
              {errors.password}
            </p>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
            비밀번호 확인 <span className="text-[var(--negative)]">*</span>
          </label>
          <InputPassword
            data-testid="sign-up-confirm-password-input"
            placeholder="비밀번호를 입력해주세요."
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            onBlur={() => handleBlur("confirmPassword")}
            className={cn(
              "w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.confirmPassword &&
              "border-[var(--negative)] focus:ring-[var(--negative)]"
            )}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-[var(--negative)]">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* 다음 버튼 */}
        <Button
          type="submit"
          data-testid="sign-up-submit-button"
          disabled={!isFormValid}
          className={cn(
            "w-full mt-5 py-2 text-base font-medium text-white rounded-md transition-colors",
            isFormValid
              ? "bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
              : "text-[var(--gray-500)] bg-[var(--bg-3)] cursor-not-allowed"
          )}
        >
          다음
        </Button>
      </form>
    </div>
  );
}
