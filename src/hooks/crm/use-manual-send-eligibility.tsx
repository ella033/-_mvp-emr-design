"use client";

import { useState } from "react";
import type { ConditionSearchPatient } from "@/types/crm/condition-search/condition-search-types";
import type { Patient } from "@/types/patient-types";
import { CrmMessageService } from "@/services/crm-message-service";
import { ConsentPrivacyType, isMarketingAgreed } from "@/constants/common/common-enum";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ConditionSearchCallbacks {
  onAllSendable: (patients: ConditionSearchPatient[]) => void;
  onPartialSendable: (sendablePatients: ConditionSearchPatient[]) => void;
  onNoneSendable: () => void;
}

interface IndividualCallbacks {
  onSendable: (patient: Patient) => void;
  onUnsendable: () => void;
}

const REASON_LABELS = {
  privacyNotAgreed: "개인정보 수집 거부",
  noPhoneNumber: "휴대폰 번호 없음",
  marketingRejected: "메시지 수신 거부",
} as const;

export function useManualSendEligibility() {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  /**
   * 사유별 인원수 문자열 생성 (0명인 항목 제외)
   */
  const buildReasonLines = (unsendableReasons: {
    privacyNotAgreed: number;
    noPhoneNumber: number;
    marketingRejected: number;
  }): string[] => {
    const lines: string[] = [];
    if (unsendableReasons.privacyNotAgreed > 0)
      lines.push(
        `・${REASON_LABELS.privacyNotAgreed} : ${unsendableReasons.privacyNotAgreed}명`
      );
    if (unsendableReasons.noPhoneNumber > 0)
      lines.push(
        `・${REASON_LABELS.noPhoneNumber} : ${unsendableReasons.noPhoneNumber}명`
      );
    if (unsendableReasons.marketingRejected > 0)
      lines.push(
        `・${REASON_LABELS.marketingRejected} : ${unsendableReasons.marketingRejected}명`
      );
    return lines;
  };

  /**
   * 조건 검색 결과에 대한 발송 가능 여부 확인 (Case 1-1, 1-2, 1-3)
   */
  const checkConditionSearchEligibility = async (
    patients: ConditionSearchPatient[],
    callbacks: ConditionSearchCallbacks
  ) => {
    const patientIds = patients.map((p) => p.id);
    const result = await CrmMessageService.checkSendEligibility(patientIds);

    const { sendablePatientIds, unsendableReasons } = result;
    const totalUnsendable =
      unsendableReasons.privacyNotAgreed +
      unsendableReasons.noPhoneNumber +
      unsendableReasons.marketingRejected;

    // Case 1-3: 전체 발송 가능
    if (totalUnsendable === 0) {
      callbacks.onAllSendable(patients);
      return;
    }

    const reasonLines = buildReasonLines(unsendableReasons);
    const sendablePatients = patients.filter((p) =>
      sendablePatientIds.includes(p.id)
    );

    if (sendablePatients.length === 0) {
      // Case 1-1: 전체 발송 불가
      setAlertState({
        isOpen: true,
        title: "발송 대상에 추가할 수 없습니다.",
        message: `검색된 환자 ${patients.length}명 모두 메시지 발송이 불가한 상태입니다.\n${reasonLines.join("\n")}`,
        onConfirm: () => {
          closeAlert();
          callbacks.onNoneSendable();
        },
      });
    } else {
      // Case 1-2: 일부 발송 불가
      setAlertState({
        isOpen: true,
        title: "메시지 발송 불가 환자 안내",
        message: `검색된 ${patients.length}명 중 ${totalUnsendable}명이 메시지 발송이 불가하여 발송 대상에서 제외됩니다.\n${reasonLines.join("\n")}`,
        onConfirm: () => {
          closeAlert();
          callbacks.onPartialSendable(sendablePatients);
        },
      });
    }
  };

  /**
   * 개별 환자에 대한 발송 가능 여부 확인 (Case 2-1, 2-2)
   * client-side 우선순위 기반 검증
   */
  const checkIndividualEligibility = (
    patient: Patient,
    callbacks: IndividualCallbacks
  ) => {
    // 우선순위 1: 개인정보 수집 거부
    if (patient.consent?.privacy === ConsentPrivacyType.거부) {
      setAlertState({
        isOpen: true,
        title: "발송 대상에 추가할 수 없습니다.",
        message: `해당 환자는 메시지 발송이 불가한 상태입니다.\n・사유 : ${REASON_LABELS.privacyNotAgreed}`,
        onConfirm: () => {
          closeAlert();
          callbacks.onUnsendable();
        },
      });
      return;
    }

    // 우선순위 2: 휴대폰 번호 없음
    if (!patient.phone1) {
      setAlertState({
        isOpen: true,
        title: "발송 대상에 추가할 수 없습니다.",
        message: `해당 환자는 메시지 발송이 불가한 상태입니다.\n・사유 : ${REASON_LABELS.noPhoneNumber}`,
        onConfirm: () => {
          closeAlert();
          callbacks.onUnsendable();
        },
      });
      return;
    }

    // 우선순위 3: 메시지 수신 거부
    if (
      patient.consent !== null &&
      !isMarketingAgreed(patient.consent?.marketing)
    ) {
      setAlertState({
        isOpen: true,
        title: "발송 대상에 추가할 수 없습니다.",
        message: `해당 환자는 메시지 발송이 불가한 상태입니다.\n・사유 : ${REASON_LABELS.marketingRejected}`,
        onConfirm: () => {
          closeAlert();
          callbacks.onUnsendable();
        },
      });
      return;
    }

    // Case 2-2: 발송 가능
    callbacks.onSendable(patient);
  };

  const ManualSendEligibilityAlert = () => (
    <MyPopupMsg
      isOpen={alertState.isOpen}
      onCloseAction={alertState.onConfirm}
      title={alertState.title}
      msgType="warning"
      message={alertState.message}
      confirmText="확인"
    />
  );

  return {
    checkConditionSearchEligibility,
    checkIndividualEligibility,
    ManualSendEligibilityAlert,
  };
}
