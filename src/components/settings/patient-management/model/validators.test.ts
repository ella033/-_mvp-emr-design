import { describe, expect, it } from "vitest";
import {
  validateBenefitForm,
  validatePatientGroupForm,
} from "./validators";

describe("validateBenefitForm", () => {
  it("returns error when name is empty", () => {
    const result = validateBenefitForm({
      name: "   ",
      unit: "PERCENT",
      valueText: "10",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorMessage).toBe("혜택명을 입력해주세요.");
    }
  });

  it("returns error for non-integer value", () => {
    const result = validateBenefitForm({
      name: "VIP",
      unit: "PERCENT",
      valueText: "10.5",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorMessage).toBe("할인 값은 정수만 입력할 수 있습니다.");
    }
  });

  it("returns error for percent out of range", () => {
    const result = validateBenefitForm({
      name: "VIP",
      unit: "PERCENT",
      valueText: "101",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorMessage).toBe(
        "백분율(%)은 0부터 100까지 입력할 수 있습니다."
      );
    }
  });

  it("returns success for valid percent", () => {
    const result = validateBenefitForm({
      name: " VIP ",
      unit: "PERCENT",
      valueText: "10",
    });

    expect(result).toEqual({
      ok: true,
      name: "VIP",
      value: 10,
    });
  });

  it("returns success for valid won value", () => {
    const result = validateBenefitForm({
      name: "고정 할인",
      unit: "WON",
      valueText: "3000",
    });

    expect(result).toEqual({
      ok: true,
      name: "고정 할인",
      value: 3000,
    });
  });
});

describe("validatePatientGroupForm", () => {
  const empty = "__none__";

  it("returns error when group name is empty", () => {
    const result = validatePatientGroupForm({
      name: " ",
      selectedBenefitValue: empty,
      emptyBenefitValue: empty,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorMessage).toBe("환자그룹명을 입력해주세요.");
    }
  });

  it("returns clearBenefit true when no benefit selected", () => {
    const result = validatePatientGroupForm({
      name: "VIP",
      selectedBenefitValue: empty,
      emptyBenefitValue: empty,
    });

    expect(result).toEqual({
      ok: true,
      name: "VIP",
      clearBenefit: true,
    });
  });

  it("returns error when benefit id is invalid", () => {
    const result = validatePatientGroupForm({
      name: "VIP",
      selectedBenefitValue: "abc",
      emptyBenefitValue: empty,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorMessage).toBe("혜택 선택 값이 올바르지 않습니다.");
    }
  });

  it("returns benefitId when valid benefit selected", () => {
    const result = validatePatientGroupForm({
      name: "VIP",
      selectedBenefitValue: "12",
      emptyBenefitValue: empty,
    });

    expect(result).toEqual({
      ok: true,
      name: "VIP",
      benefitId: 12,
      clearBenefit: false,
    });
  });
});
