import { ApiError } from "@/lib/api/api-proxy";

// 검증 예시
export function validateProductData(data: any): string[] {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== "string") {
    errors.push("Name is required");
  }

  if (!data.price || typeof data.price !== "number" || data.price <= 0) {
    errors.push("Valid price is required");
  }

  if (!data.category || typeof data.category !== "string") {
    errors.push("Category is required");
  }

  return errors;
}

// 파라미터 검증 유틸리티 - 오버로드
export function validateId(id: string | number, name: string): string {
  if (id === undefined || id === null || id === "") {
    throw new ApiError(`${name} is required`, 400);
  }

  if (typeof id === "number" && (isNaN(id) || id <= 0)) {
    throw new ApiError(`${name} must be a valid positive number`, 400);
  }

  if (typeof id === "string" && id.trim() === "") {
    throw new ApiError(`${name} cannot be empty`, 400);
  }

  return String(id);
}

// 비밀번호 복잡도 검증 (영대문자, 영소문자, 숫자, 특수문자 중 3종류 이상 조합)
export function validatePasswordComplexity(password: string): boolean {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const typeCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;

  return typeCount >= 3;
}
