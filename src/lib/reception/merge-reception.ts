import type { Reception } from "@/types/common/reception-types";

/**
 * Reception 객체와 Partial<Reception> 업데이트를 병합하는 공통 유틸리티
 * - patientBaseInfo / insuranceInfo / patientStatus 는 얕은 병합
 * - receptionInfo.paymentInfo 는 깊은 병합
 *   - payments 배열은 항상 "전체 교체" (부분 업데이트 X)
 */
export function mergeReception(
  base: Reception,
  updates: Partial<Reception>
): Reception {
  // receptionInfo 기본값 방어
  const baseReceptionInfo = base.receptionInfo ?? ({} as Reception["receptionInfo"]);

  // receptionInfo의 paymentInfo를 깊은 병합 처리
  let mergedReceptionInfo = baseReceptionInfo;

  if (updates.receptionInfo) {
    mergedReceptionInfo = {
      ...baseReceptionInfo,
      ...updates.receptionInfo,
    };

    if (updates.receptionInfo.paymentInfo) {
      mergedReceptionInfo.paymentInfo = {
        ...baseReceptionInfo.paymentInfo,
        ...updates.receptionInfo.paymentInfo,
        payments:
          updates.receptionInfo.paymentInfo.payments ??
          baseReceptionInfo.paymentInfo?.payments ??
          [],
      };
    }
  }

  // patientStatus 병합 (chronicFlags 깊은 병합 포함)
  let mergedPatientStatus = base.patientStatus;
  if (updates.patientStatus) {
    mergedPatientStatus = {
      ...base.patientStatus,
      ...updates.patientStatus,
      // chronicFlags 깊은 병합
      chronicFlags: updates.patientStatus.chronicFlags
        ? {
          ...base.patientStatus?.chronicFlags,
          ...updates.patientStatus.chronicFlags,
        }
        : base.patientStatus?.chronicFlags,
    };
  }

  return {
    ...base,
    ...updates,
    patientBaseInfo: updates.patientBaseInfo
      ? { ...base.patientBaseInfo, ...updates.patientBaseInfo }
      : base.patientBaseInfo,
    insuranceInfo: updates.insuranceInfo
      ? { ...base.insuranceInfo, ...updates.insuranceInfo }
      : base.insuranceInfo,
    receptionInfo: mergedReceptionInfo,
    patientStatus: mergedPatientStatus,
  };
}


