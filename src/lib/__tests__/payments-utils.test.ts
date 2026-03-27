import { describe, it, expect } from "vitest";
import { getIdentificationTypeFromApprovalMethod } from "../payments-utils";
import { CashApprovalMethod } from "@/constants/common/common-enum";
import { IdentificationTypes } from "@/services/pay-bridge";

describe("getIdentificationTypeFromApprovalMethod", () => {
  it("should return Phone for 휴대폰번호", () => {
    expect(
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.휴대폰번호)
    ).toBe(IdentificationTypes.Phone);
  });

  it("should return CardNumber for 카드번호", () => {
    expect(
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.카드번호)
    ).toBe(IdentificationTypes.CardNumber);
  });

  it("should return Business for 사업자등록번호", () => {
    expect(
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.사업자등록번호)
    ).toBe(IdentificationTypes.Business);
  });

  it("should return Resident for 주민등록번호", () => {
    expect(
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.주민등록번호)
    ).toBe(IdentificationTypes.Resident);
  });

  it("should return Other for 자진발급번호", () => {
    expect(
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.자진발급번호)
    ).toBe(IdentificationTypes.Other);
  });

  it("should throw an error for 기타 (unmapped value)", () => {
    expect(() =>
      getIdentificationTypeFromApprovalMethod(CashApprovalMethod.기타)
    ).toThrow("유효하지 않은 승인방법입니다.");
  });

  it("should throw an error for an unknown value", () => {
    expect(() =>
      getIdentificationTypeFromApprovalMethod(
        "unknown" as unknown as CashApprovalMethod
      )
    ).toThrow("유효하지 않은 승인방법입니다.");
  });
});
