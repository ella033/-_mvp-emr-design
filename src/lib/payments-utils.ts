import { CashApprovalMethod } from "@/constants/common/common-enum";
import { IdentificationTypes } from "@/services/pay-bridge";

/**
 * CashApprovalMethod를 IdentificationTypes로 변환하는 유틸리티 함수
 * @param approvalMethod - 현금영수증 승인 방법
 * @returns IdentificationTypes - 식별 타입
 * @throws Error - 유효하지 않은 승인방법인 경우
 */
export function getIdentificationTypeFromApprovalMethod(
  approvalMethod: CashApprovalMethod
): IdentificationTypes {
  if (approvalMethod === CashApprovalMethod.휴대폰번호) {
    return IdentificationTypes.Phone;
  } else if (approvalMethod === CashApprovalMethod.카드번호) {
    return IdentificationTypes.CardNumber;
  } else if (approvalMethod === CashApprovalMethod.사업자등록번호) {
    return IdentificationTypes.Business;
  } else if (approvalMethod === CashApprovalMethod.주민등록번호) {
    return IdentificationTypes.Resident;
  } else if (approvalMethod === CashApprovalMethod.자진발급번호) {
    return IdentificationTypes.Other;
  } else {
    throw new Error('유효하지 않은 승인방법입니다.');
  }
}

