import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import {
  보험구분,
  보험구분상세,
  차상위보험구분,
  만성질환관리제,
  보훈등급,
  본인부담구분코드,
  피보험자와의관계,
} from "@/constants/common/common-enum";
import { useInsuranceStore, calculateUDept } from "./insurance-store";

// ================================ Helpers ================================

const makeInsuranceInfo = (
  overrides: Partial<InsuranceInfo> = {}
): InsuranceInfo => ({
  isBaby: false,
  fatherRrn: "",
  patientId: "1",
  uDeptDetail: 보험구분상세.일반,
  차상위보험구분: 차상위보험구분.직장조합,
  unionCode: "",
  unionName: "",
  자보사고번호: "",
  paymentGuaranteeNumber: "",
  paymentAwardDate: new Date("2024-01-01"),
  paymentLostDate: new Date("2025-01-01"),
  insuranceCompany: "",
  cardNumber: "",
  father: "",
  relation: 피보험자와의관계.해당없음,
  is임신부: false,
  is난임치료: false,
  is만성질환관리: false,
  만성질환관리제: 만성질환관리제.해당없음,
  is의원급만성질환관리제: false,
  보훈여부: false,
  veteranGrade: 보훈등급.보훈없음,
  산재후유: false,
  ori본인부담구분코드: 본인부담구분코드.해당없음,
  cfcd: 본인부담구분코드.해당없음,
  차상위승인일: new Date("2024-01-01"),
  차상위종료일: new Date("2025-12-31"),
  차상위특정기호: "",
  modifyItemList: [],
  identityOptional: false,
  eligibilityCheck: {} as any,
  chronicCtrlMngHist: {} as any,
  uDept: 보험구분.일반,
  만성질환관리제ForBinding: "",
  veteranGradeForBinding: "",
  본인부담구분코드ForDisplay: "",
  차상위보험구분Description: "",
  ...overrides,
});

const getInitialState = () => ({
  insuranceInfo: null,
  isLoading: false,
  error: null,
});

// ================================ Tests ================================

describe("insurance-store", () => {
  beforeEach(() => {
    useInsuranceStore.setState(getInitialState());
  });

  // ============================== calculateUDept (exported helper) ==============================

  describe("calculateUDept", () => {
    it("maps 일반 to 보험구분.일반", () => {
      expect(calculateUDept(보험구분상세.일반)).toBe(보험구분.일반);
    });

    it("maps 국민공단 to 보험구분.국민공단", () => {
      expect(calculateUDept(보험구분상세.국민공단)).toBe(보험구분.국민공단);
    });

    it("maps 직장조합 to 보험구분.직장조합", () => {
      expect(calculateUDept(보험구분상세.직장조합)).toBe(보험구분.직장조합);
    });

    it("maps 의료급여1종 to 보험구분.급여1종", () => {
      expect(calculateUDept(보험구분상세.의료급여1종)).toBe(보험구분.급여1종);
    });

    it("maps 의료급여2종 to 보험구분.급여2종", () => {
      expect(calculateUDept(보험구분상세.의료급여2종)).toBe(보험구분.급여2종);
    });

    it("maps 의료급여2종장애 to 보험구분.급여2종", () => {
      expect(calculateUDept(보험구분상세.의료급여2종장애)).toBe(보험구분.급여2종);
    });

    it("maps 자보 to 보험구분.자보", () => {
      expect(calculateUDept(보험구분상세.자보)).toBe(보험구분.자보);
    });

    it("maps 산재 to 보험구분.산재", () => {
      expect(calculateUDept(보험구분상세.산재)).toBe(보험구분.산재);
    });

    it("maps 재해 to 보험구분.재해", () => {
      expect(calculateUDept(보험구분상세.재해)).toBe(보험구분.재해);
    });

    it("maps 차상위1종 to 국민공단 when 차상위보험구분 is 1", () => {
      expect(calculateUDept(보험구분상세.차상위1종, 1)).toBe(보험구분.국민공단);
    });

    it("maps 차상위2종 to 직장조합 when 차상위보험구분 is 0", () => {
      expect(calculateUDept(보험구분상세.차상위2종, 0)).toBe(보험구분.직장조합);
    });

    it("maps 차상위2종장애 to 국민공단 when 차상위보험구분 is 1", () => {
      expect(calculateUDept(보험구분상세.차상위2종장애, 1)).toBe(보험구분.국민공단);
    });

    it("defaults 차상위 to 직장조합 when 차상위보험구분 is omitted", () => {
      // default param is 0, which is not 1, so returns 직장조합
      expect(calculateUDept(보험구분상세.차상위1종)).toBe(보험구분.직장조합);
    });

    it("returns 보험구분.일반 for unknown detail values", () => {
      expect(calculateUDept(999)).toBe(보험구분.일반);
    });
  });

  // ============================== Basic actions ==============================

  describe("setInsuranceInfo", () => {
    it("sets insurance info and computes uDept", () => {
      const info = makeInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여1종 });
      useInsuranceStore.getState().setInsuranceInfo(info);

      const stored = useInsuranceStore.getState().insuranceInfo;
      expect(stored).not.toBeNull();
      expect(stored!.uDept).toBe(보험구분.급여1종);
    });

    it("overwrites previously set insurance info", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.자보 }));
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.산재 }));

      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.산재);
    });
  });

  describe("updateInsuranceInfo", () => {
    it("partially updates insurance info and recomputes uDept", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.일반 }));
      useInsuranceStore.getState().updateInsuranceInfo({ uDeptDetail: 보험구분상세.재해 });

      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.재해);
    });

    it("does nothing when insuranceInfo is null", () => {
      useInsuranceStore.getState().updateInsuranceInfo({ isBaby: true });
      expect(useInsuranceStore.getState().insuranceInfo).toBeNull();
    });

    it("preserves existing fields when updating", () => {
      const info = makeInsuranceInfo({ isBaby: true, uDeptDetail: 보험구분상세.일반 });
      useInsuranceStore.getState().setInsuranceInfo(info);
      useInsuranceStore.getState().updateInsuranceInfo({ 보훈여부: true });

      const stored = useInsuranceStore.getState().insuranceInfo!;
      expect(stored.isBaby).toBe(true);
      expect(stored.보훈여부).toBe(true);
    });
  });

  describe("clearInsuranceInfo", () => {
    it("clears insurance info to null", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo());
      useInsuranceStore.getState().clearInsuranceInfo();
      expect(useInsuranceStore.getState().insuranceInfo).toBeNull();
    });
  });

  describe("setLoading / setError", () => {
    it("sets loading state", () => {
      useInsuranceStore.getState().setLoading(true);
      expect(useInsuranceStore.getState().isLoading).toBe(true);
    });

    it("sets error state", () => {
      useInsuranceStore.getState().setError("something went wrong");
      expect(useInsuranceStore.getState().error).toBe("something went wrong");
    });

    it("clears error to null", () => {
      useInsuranceStore.getState().setError("err");
      useInsuranceStore.getState().setError(null);
      expect(useInsuranceStore.getState().error).toBeNull();
    });
  });

  // ============================== Computed fields ==============================

  describe("getComputedFields", () => {
    it("returns null when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().getComputedFields()).toBeNull();
    });

    it("returns computed uDept for 의료급여2종", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여2종 }));
      const fields = useInsuranceStore.getState().getComputedFields();
      expect(fields).not.toBeNull();
      expect(fields!.uDept).toBe(보험구분.급여2종);
    });

    it("handles 차상위 with 국민공단 sub-type", () => {
      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          uDeptDetail: 보험구분상세.차상위1종,
          차상위보험구분: 차상위보험구분.국민공단,
        })
      );
      const fields = useInsuranceStore.getState().getComputedFields();
      expect(fields!.uDept).toBe(보험구분.국민공단);
    });

    it("handles 차상위 with 직장조합 sub-type", () => {
      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          uDeptDetail: 보험구분상세.차상위2종,
          차상위보험구분: 차상위보험구분.직장조합,
        })
      );
      const fields = useInsuranceStore.getState().getComputedFields();
      expect(fields!.uDept).toBe(보험구분.직장조합);
    });
  });

  // ============================== Additional computed fields ==============================

  describe("getAdditionalComputedFields", () => {
    it("returns null when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().getAdditionalComputedFields()).toBeNull();
    });

    it("returns veteranGradeForBinding as string", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ veteranGrade: 보훈등급.보훈없음 }));
      const fields = useInsuranceStore.getState().getAdditionalComputedFields();
      expect(fields!.veteranGradeForBinding).toBe("0");
    });

    it("returns 본인부담구분코드ForDisplay as string", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ cfcd: 본인부담구분코드.해당없음 }));
      const fields = useInsuranceStore.getState().getAdditionalComputedFields();
      expect(fields!.본인부담구분코드ForDisplay).toBe("0");
    });

    it("returns empty string for undefined veteranGrade", () => {
      const info = makeInsuranceInfo();
      // @ts-expect-error testing undefined path
      info.veteranGrade = undefined;
      useInsuranceStore.getState().setInsuranceInfo(info);
      const fields = useInsuranceStore.getState().getAdditionalComputedFields();
      expect(fields!.veteranGradeForBinding).toBe("");
    });

    it("includes uDept from computed fields", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.자보 }));
      const fields = useInsuranceStore.getState().getAdditionalComputedFields();
      expect(fields!.uDept).toBe(보험구분.자보);
    });
  });

  // ============================== Insurance summary ==============================

  describe("getInsuranceSummary", () => {
    it("returns null when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().getInsuranceSummary()).toBeNull();
    });

    it("detects medical aid (급여1종)", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여1종 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isMedicalAid).toBe(true);
    });

    it("detects medical aid (급여2종)", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여2종 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isMedicalAid).toBe(true);
    });

    it("non-medical-aid for 일반 insurance", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.일반 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isMedicalAid).toBe(false);
    });

    it("detects veteran status", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ 보훈여부: true }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isVeteran).toBe(true);
    });

    it("detects industrial accident", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ 산재후유: true }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isIndustrialAccident).toBe(true);
    });

    it("detects baby", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ isBaby: true }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isBaby).toBe(true);
    });

    it("detects pregnant status", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ is임신부: true }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isPregnant).toBe(true);
    });

    it("detects infertility treatment", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ is난임치료: true }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isInfertilityTreatment).toBe(true);
    });

    it("isPrivateInsurance is false for 자보 (uDept===5, code checks ===6)", () => {
      // NOTE: The source checks uDept === 6 (산재) for isPrivateInsurance,
      // which appears to be a bug. 자보 is uDept 5. Testing actual behavior.
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.자보 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isPrivateInsurance).toBe(false);
    });

    it("isPrivateInsurance is true for 산재 (uDept===6, code checks ===6)", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.산재 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isPrivateInsurance).toBe(true);
    });

    it("detects secondary insurance for 국민공단", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.국민공단 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isSecondaryInsurance).toBe(true);
    });

    it("detects secondary insurance for 직장조합", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.직장조합 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isSecondaryInsurance).toBe(true);
    });

    it("no secondary insurance for 산재", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.산재 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.isSecondaryInsurance).toBe(false);
    });

    it("includes insurance type detail", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여1종 }));
      const summary = useInsuranceStore.getState().getInsuranceSummary()!;
      expect(summary.insuranceType).toBe(보험구분.급여1종);
      expect(summary.insuranceTypeDetail).toBe(보험구분상세.의료급여1종);
    });
  });

  // ============================== Utility functions ==============================

  describe("isInsuranceValid", () => {
    it("returns false when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().isInsuranceValid()).toBe(false);
    });

    it("returns true when insuranceInfo is set", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo());
      expect(useInsuranceStore.getState().isInsuranceValid()).toBe(true);
    });
  });

  describe("getInsuranceTypeName", () => {
    it("returns empty string when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().getInsuranceTypeName()).toBe("");
    });

    it("returns uDept as string", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.자보 }));
      expect(useInsuranceStore.getState().getInsuranceTypeName()).toBe(
        보험구분.자보.toString()
      );
    });
  });

  describe("isSecondaryInsuranceActive", () => {
    let realDateNow: () => number;

    beforeEach(() => {
      realDateNow = Date.now;
    });

    afterEach(() => {
      Date.now = realDateNow;
      vi.useRealTimers();
    });

    it("returns false when insuranceInfo is null", () => {
      expect(useInsuranceStore.getState().isSecondaryInsuranceActive()).toBe(false);
    });

    it("returns true when today is within approval date range", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15"));

      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          차상위승인일: new Date("2024-01-01"),
          차상위종료일: new Date("2025-12-31"),
        })
      );
      expect(useInsuranceStore.getState().isSecondaryInsuranceActive()).toBe(true);
    });

    it("returns false when today is before approval start date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-06-15"));

      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          차상위승인일: new Date("2024-01-01"),
          차상위종료일: new Date("2025-12-31"),
        })
      );
      expect(useInsuranceStore.getState().isSecondaryInsuranceActive()).toBe(false);
    });

    it("returns false when today is after approval end date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15"));

      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          차상위승인일: new Date("2024-01-01"),
          차상위종료일: new Date("2025-12-31"),
        })
      );
      expect(useInsuranceStore.getState().isSecondaryInsuranceActive()).toBe(false);
    });

    it("returns true when 종료일 is falsy (no end date)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15"));

      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          차상위승인일: new Date("2024-01-01"),
          // @ts-expect-error testing falsy end date
          차상위종료일: null,
        })
      );
      expect(useInsuranceStore.getState().isSecondaryInsuranceActive()).toBe(true);
    });
  });

  // ============================== uDept recomputation on update ==============================

  describe("uDept recomputation", () => {
    it("recomputes uDept when uDeptDetail changes via updateInsuranceInfo", () => {
      useInsuranceStore.getState().setInsuranceInfo(makeInsuranceInfo({ uDeptDetail: 보험구분상세.일반 }));
      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.일반);

      useInsuranceStore.getState().updateInsuranceInfo({ uDeptDetail: 보험구분상세.의료급여1종 });
      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.급여1종);
    });

    it("recomputes uDept correctly for 차상위 when 차상위보험구분 changes", () => {
      useInsuranceStore.getState().setInsuranceInfo(
        makeInsuranceInfo({
          uDeptDetail: 보험구분상세.차상위2종,
          차상위보험구분: 차상위보험구분.직장조합,
        })
      );
      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.직장조합);

      useInsuranceStore.getState().updateInsuranceInfo({ 차상위보험구분: 차상위보험구분.국민공단 });
      expect(useInsuranceStore.getState().insuranceInfo!.uDept).toBe(보험구분.국민공단);
    });
  });
});
