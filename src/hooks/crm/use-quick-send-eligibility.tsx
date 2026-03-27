"use client";

import { useState } from "react";
import type { QuickMessageRecipient } from "@/app/crm/_components/message/quick-message-form";
import { CrmMessageService } from "@/services/crm-message-service";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface QuickSendCallbacks {
  onAllSendable: (recipients: QuickMessageRecipient[]) => void;
  onPartialSendable: (filteredRecipients: QuickMessageRecipient[]) => void;
  onNoneSendable: () => void;
}

export function useQuickSendEligibility() {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const checkAndPrepareQuickSend = async (
    recipients: QuickMessageRecipient[],
    callbacks: QuickSendCallbacks
  ) => {
    const patientIds = recipients.map((r) => r.id);
    const result = await CrmMessageService.checkSendEligibility(patientIds);

    const { sendablePatientIds, unsendableReasons } = result;
    const totalUnsendable =
      unsendableReasons.privacyNotAgreed +
      unsendableReasons.noPhoneNumber +
      unsendableReasons.marketingRejected;

    if (totalUnsendable === 0) {
      callbacks.onAllSendable(recipients);
      return;
    }

    // 사유별 메시지 생성 (0명인 항목 제외)
    const reasonLines: string[] = [];
    if (unsendableReasons.privacyNotAgreed > 0)
      reasonLines.push(
        `・개인정보 수집 미동의 : ${unsendableReasons.privacyNotAgreed}명`
      );
    if (unsendableReasons.noPhoneNumber > 0)
      reasonLines.push(
        `・휴대폰 번호 없음 : ${unsendableReasons.noPhoneNumber}명`
      );
    if (unsendableReasons.marketingRejected > 0)
      reasonLines.push(
        `・메시지 수신 거부 : ${unsendableReasons.marketingRejected}명`
      );

    const filteredRecipients = recipients.filter((r) =>
      sendablePatientIds.includes(r.id)
    );

    if (filteredRecipients.length === 0) {
      // 전체 발송 불가
      setAlertState({
        isOpen: true,
        title: "메시지를 발송할 수 없습니다.",
        message: `선택된 환자 모두 메시지 발송이 불가한 상태입니다.\n${reasonLines.join("\n")}`,
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, isOpen: false }));
          callbacks.onNoneSendable();
        },
      });
    } else {
      // 일부 발송 불가
      setAlertState({
        isOpen: true,
        title: "메시지 발송 불가 환자 안내",
        message: `선택된 ${recipients.length}명 중 ${totalUnsendable}명이 발송 대상에서 제외됩니다.\n${reasonLines.join("\n")}`,
        onConfirm: () => {
          setAlertState((prev) => ({ ...prev, isOpen: false }));
          callbacks.onPartialSendable(filteredRecipients);
        },
      });
    }
  };

  const EligibilityAlert = () => (
    <MyPopupMsg
      isOpen={alertState.isOpen}
      onCloseAction={alertState.onConfirm}
      title={alertState.title}
      msgType="warning"
      message={alertState.message}
      confirmText="확인"
    />
  );

  return { checkAndPrepareQuickSend, EligibilityAlert };
}
