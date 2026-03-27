import type { DiscountUnit } from "./index";

type BenefitValidationInput = {
  name: string;
  unit: DiscountUnit;
  valueText: string;
};

type BenefitValidationResult =
  | { ok: true; name: string; value: number }
  | { ok: false; errorMessage: string };

export function validateBenefitForm(
  input: BenefitValidationInput
): BenefitValidationResult {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { ok: false, errorMessage: "혜택명을 입력해주세요." };
  }

  const parsedValue = Number(input.valueText);
  if (!Number.isInteger(parsedValue)) {
    return { ok: false, errorMessage: "할인 값은 정수만 입력할 수 있습니다." };
  }

  if (input.unit === "PERCENT" && (parsedValue < 0 || parsedValue > 100)) {
    return {
      ok: false,
      errorMessage: "백분율(%)은 0부터 100까지 입력할 수 있습니다.",
    };
  }

  if (input.unit === "WON" && parsedValue < 0) {
    return {
      ok: false,
      errorMessage: "원 단위 할인값은 0 이상이어야 합니다.",
    };
  }

  return {
    ok: true,
    name: trimmedName,
    value: parsedValue,
  };
}

type GroupValidationInput = {
  name: string;
  selectedBenefitValue: string;
  emptyBenefitValue: string;
};

type GroupValidationResult =
  | { ok: true; name: string; benefitId?: number; clearBenefit: boolean }
  | { ok: false; errorMessage: string };

export function validatePatientGroupForm(
  input: GroupValidationInput
): GroupValidationResult {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { ok: false, errorMessage: "환자그룹명을 입력해주세요." };
  }

  if (input.selectedBenefitValue === input.emptyBenefitValue) {
    return { ok: true, name: trimmedName, clearBenefit: true };
  }

  const parsedBenefitId = Number(input.selectedBenefitValue);
  if (!Number.isInteger(parsedBenefitId) || parsedBenefitId <= 0) {
    return { ok: false, errorMessage: "혜택 선택 값이 올바르지 않습니다." };
  }

  return {
    ok: true,
    name: trimmedName,
    benefitId: parsedBenefitId,
    clearBenefit: false,
  };
}
