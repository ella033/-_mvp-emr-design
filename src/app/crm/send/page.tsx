"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import MySplitPane from "@/components/yjg/my-split-pane";
import Recipients, {
  type RecipientsRef,
  type RecipientPatient,
} from "./_components/recipients";
import SendSettings from "./_components/settings";
import ConditionSearch from "./_components/condition-search";
import ChartSearch from "./_components/chart-search";
import SendMessageForm from "../_components/message/send-message-form";
import type { Patient } from "@/types/patient-types";
import {
  CrmMessageType,
  CrmMessageSubType,
  CrmSendType,
} from "@/constants/crm-enums";
import { useDebounce } from "@/hooks/use-debounce";
import { useSendMessage } from "@/hooks/crm/use-send-message";
import { useManualSendEligibility } from "@/hooks/crm/use-manual-send-eligibility";
import type {
  CrmMessageSendRequest,
  CrmMessageRecipient,
} from "@/types/crm/send-message/crm-message-types";
import type { MessageData } from "@/types/crm/message-template/message-types";
import type { ConditionSearchPatient } from "@/types/crm/condition-search/condition-search-types";
import { useToastHelpers } from "@/components/ui/toast";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";

// 발송 설정 데이터 타입 정의
export interface SendSettingsData {
  isReserved: boolean;
  sendDate?: string;
  sendTime?: string;
  senderNumber: string;
}

// 발송 설정 핸들러 타입 정의
export interface SendSettingsHandlers {
  setIsReserved: (isReserved: boolean) => void;
  setSendDate: (date: string) => void;
  setSendTime: (time: string) => void;
  setSenderNumber: (number: string) => void;
}

// 검색 타입 버튼 그룹 데이터
const searchTypeButtons: ButtonGroupItem[] = [
  { id: "condition", title: "조건 검색" },
  { id: "individual", title: "개별 검색" },
];

const convertToRecipientPatient = (patient: Patient): RecipientPatient => {
  return {
    id: patient.id,
    patientNo: patient.patientNo,
    name: patient.name,
    birthDate: patient.birthDate ?? "",
    gender: patient.gender ?? 1,
    phone: patient.phone1,
    lastEncounterDate: patient.lastEncounterDate?.toString() ?? null,
  };
};

const convertToRecipientPatientFromConditionSearch = (
  patient: ConditionSearchPatient
): RecipientPatient => {
  return {
    id: patient.id,
    patientNo: patient.patientNo,
    name: patient.name,
    birthDate: patient.birthDate,
    gender: patient.gender,
    phone: patient.phone1,
    lastEncounterDate: patient.lastEncounterDate?.toString() ?? null,
  };
};

export default function CrmSendPage() {
  const toastHelpers = useToastHelpers();
  const {
    checkConditionSearchEligibility,
    checkIndividualEligibility,
    ManualSendEligibilityAlert,
  } = useManualSendEligibility();

  const [activeSearchType, setActiveSearchType] = useState<string>("condition");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const [isReservedTimeAlertOpen, setIsReservedTimeAlertOpen] =
    useState<boolean>(false);

  // Recipients 컴포넌트 ref
  const recipientsRef = useRef<RecipientsRef>(null);

  const [sendRequest, setSendRequest] = useState<CrmMessageSendRequest | null>(
    null
  );
  const debouncedSendRequest = useDebounce(sendRequest, 500);

  // CRM 메시지 발송 mutation
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      toastHelpers.success("발송이 완료되었습니다.");
    },
    onError: (error) => {
      toastHelpers.error(error.message || "발송이 실패하였습니다.");
    },
  });

  useEffect(() => {
    if (!debouncedSendRequest || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(debouncedSendRequest);
    setSendRequest(null);
  }, [debouncedSendRequest, sendMessageMutation.mutate]);

  const [messageData, setMessageData] = useState<MessageData>({
    messageType: CrmMessageType.문자,
    messageContent: "",
    messageSubType: CrmMessageSubType.SMS,
    isAdDisplayed: false,
    images: [],
  });

  // 발송 설정 상태
  const [sendSettings, setSendSettings] = useState<SendSettingsData>({
    isReserved: false,
    senderNumber: "",
  });

  // 발송 설정 업데이트 핸들러
  const updateSendSettings = (updates: Partial<SendSettingsData>) => {
    setSendSettings((prev) => ({ ...prev, ...updates }));
  };

  // 개별 설정 핸들러들
  const sendSettingsHandlers: SendSettingsHandlers = {
    setIsReserved: (isReserved) => updateSendSettings({ isReserved }),
    setSendDate: (date) => updateSendSettings({ sendDate: date }),
    setSendTime: (time) => updateSendSettings({ sendTime: time }),
    setSenderNumber: (number) => updateSendSettings({ senderNumber: number }),
  };

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (buttonId: string) => {
    setActiveSearchType(buttonId);
  };

  // 환자 선택 핸들러 (ChartSearch에서 호출됨)
  const handlePatientSelect = (patient: Patient) => {
    checkIndividualEligibility(patient, {
      onSendable: (p) => {
        const recipientPatient = convertToRecipientPatient(p);
        recipientsRef.current?.addPatient(recipientPatient);
      },
      onUnsendable: () => {},
    });
  };

  // 조건 검색 결과 핸들러 (ConditionSearch에서 호출됨)
  const handleConditionSearchResults = async (
    patients: ConditionSearchPatient[]
  ) => {
    await checkConditionSearchEligibility(patients, {
      onAllSendable: (allPatients) => {
        const recipientPatients = allPatients.map(
          convertToRecipientPatientFromConditionSearch
        );
        recipientsRef.current?.setPatients(recipientPatients);
      },
      onPartialSendable: (sendablePatients) => {
        const recipientPatients = sendablePatients.map(
          convertToRecipientPatientFromConditionSearch
        );
        recipientsRef.current?.setPatients(recipientPatients);
      },
      onNoneSendable: () => {},
    });
  };

  // RecipientPatient를 CrmMessageRecipient로 변환하는 함수
  const convertToMessageRecipient = useCallback(
    (patient: RecipientPatient): CrmMessageRecipient => {
      return {
        patientId: patient.id,
        recipientName: patient.name,
        recipientPhone: patient.phone,
      };
    },
    []
  );

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleSend = useCallback(() => {
    const recipientPatients = recipientsRef.current?.getPatients() || [];

    if (recipientPatients.length === 0) {
      showAlert("발송 대상이 없습니다.");
      return;
    }
    if (!messageData.messageContent) {
      showAlert("메시지 내용을 입력하세요.");
      return;
    }

    // 예약 발송인 경우 예약 시간이 현재 시간보다 이전인지 확인
    if (sendSettings.isReserved) {
      if (!sendSettings.sendDate || !sendSettings.sendTime) {
        setIsReservedTimeAlertOpen(true);
        return;
      }

      const reservedDateTime = new Date(
        `${sendSettings.sendDate}T${sendSettings.sendTime}:00`
      );
      const now = new Date();
      if (reservedDateTime <= now) {
        setIsReservedTimeAlertOpen(true);
        return;
      }
    }

    const request: CrmMessageSendRequest = {
      recipients: recipientPatients.map(convertToMessageRecipient),
      messageType: messageData.messageType,
      messageContent: messageData.messageContent,
      isAdDisplayed: messageData.isAdDisplayed,
      messageTemplateId: messageData.messageTemplateId,
      sendType: CrmSendType.수동발송,
      senderNumber: sendSettings.senderNumber,
      // 예약 발송인 경우 isReserved와 sendDateTime 필드 추가 (ISO 8601 KST 형식)
      ...(sendSettings.isReserved &&
        sendSettings.sendDate &&
        sendSettings.sendTime && {
        sendDateTime: `${sendSettings.sendDate}T${sendSettings.sendTime}:00+09:00`,
      }),
      // 첨부 이미지 추가
      ...(messageData.images &&
        messageData.images.length > 0 && {
        image1: messageData.images[0]?.file,
        ...(messageData.images.length > 1 && {
          image2: messageData.images[1]?.file,
        }),
        ...(messageData.images.length > 2 && {
          image3: messageData.images[2]?.file,
        }),
      }),
    };

    setSendRequest(request);
  }, [messageData, sendSettings, convertToMessageRecipient]);

  return (
    <>
      <div className="w-full h-full bg-[var(--bg-2)]" data-testid="crm-send-page">
        <MySplitPane
          splitPaneId="crm-send-main-split"
          testId="crm-send-split"
          isVertical={false}
          panes={[
            // 좌측 패널 (발송 대상 검색)
            <div key="search-panel" className="w-full h-full flex flex-col" data-testid="crm-search-panel">
              {/* 상단 검색 타입 버튼 그룹 */}
              <div className="px-4 py-3 bg-[var(--bg-main)] border-r border-[var(--border-2)]">
                <ButtonGroup
                  buttons={searchTypeButtons}
                  activeButtonId={activeSearchType}
                  onButtonChangeAction={handleSearchTypeChange}
                  className="text-sm"
                  testId="crm-search-type-tabs"
                />
              </div>

              {/* 검색 패널 내용 */}
              <div className="flex-1 min-h-0">
                {activeSearchType === "condition" ? (
                  <ConditionSearch
                    onSearchResults={handleConditionSearchResults}
                  />
                ) : (
                  <ChartSearch onPatientSelect={handlePatientSelect} />
                )}
              </div>
            </div>,

            // 중앙 패널 (발송 대상)
            <div key="recipients-panel" className="w-full h-full pl-2 py-2" data-testid="crm-recipients-panel">
              <div className="bg-white border border-[var(--border-1)] rounded-md h-full flex flex-col">
                {/* 발송 대상 목록 영역 */}
                <div className="flex-1 min-h-0 max-h-[calc(100vh-200px)] overflow-hidden">
                  <Recipients ref={recipientsRef} />
                </div>

                {/* 발송 설정 영역 */}
                <div className="p-4 flex-shrink-0">
                  <SendSettings
                    sendSettings={sendSettings}
                    sendSettingsHandlers={sendSettingsHandlers}
                  />
                </div>
              </div>
            </div>,

            // 우측 패널 (메시지 발송)
            <div key="send-message-form-panel" className="w-full h-full p-2" data-testid="crm-message-panel">
              <div className="bg-white border border-[var(--border-1)] rounded-md h-full flex flex-col">
                {/* 메시지 폼 영역 */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <SendMessageForm
                    messageData={messageData}
                    onMessageDataChange={setMessageData}
                  />
                </div>

                {/* 하단 버튼 */}
                <div className="p-4 flex flex-shrink-0">
                  <Button
                    onClick={handleSend}
                    data-testid="crm-send-submit-button"
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 bg-[var(--main-color)] hover:bg-[var(--main-color-hover)]"
                  >
                    {sendMessageMutation.isPending ? "발송 중..." : "발송"}
                  </Button>
                </div>
              </div>
            </div>,
          ]}
          initialRatios={[0.28, 0.25, 0.47]}
          minPaneRatio={0.15}
        />
      </div>
      <MyPopupMsg
        isOpen={isAlertOpen}
        onCloseAction={() => setIsAlertOpen(false)}
        title="알림"
        msgType="warning"
        message={alertMessage}
        confirmText="확인"
      />
      <MyPopupMsg
        isOpen={isReservedTimeAlertOpen}
        onCloseAction={() => setIsReservedTimeAlertOpen(false)}
        title="발송 일시를 다시 선택해 주세요"
        msgType="warning"
        message="현재 시각 이전으로는 예약발송할 수 없습니다."
        confirmText="확인"
      />
      <ManualSendEligibilityAlert />
    </>
  );
}
