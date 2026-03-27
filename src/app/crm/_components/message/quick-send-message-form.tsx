"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import MyPopup, { MyPopupMsg } from "@/components/yjg/my-pop-up";
import QuickMessageForm, {
  type QuickMessageRecipient,
} from "./quick-message-form";
import TemplateListModal from "@/app/crm/_components/template/template-list";
import {
  CrmMessageSubType,
  CrmMessageType,
  CrmSendType,
} from "@/constants/crm-enums";
import { FileService } from "@/services/file-service";
import { useToastHelpers } from "@/components/ui/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useSendMessage } from "@/hooks/crm/use-send-message";
import type { MessageData } from "@/types/crm/message-template/message-types";
import type { GetTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";
import type {
  SendSettingsData,
  SendSettingsHandlers,
} from "@/app/crm/send/page";
import type {
  CrmMessageSendRequest,
  CrmMessageRecipient,
} from "@/types/crm/send-message/crm-message-types";

interface QuickSendMessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (messageData: MessageData) => void;
  recipients?: QuickMessageRecipient[];
  onRecipientRemove?: (id: number) => void;
}

const QuickSendMessageForm: React.FC<QuickSendMessageFormProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipients = [],
  onRecipientRemove,
}) => {
  const toastHelpers = useToastHelpers();

  const uniqueRecipients = useMemo(() => {
    const seen = new Set<number>();
    return recipients.filter((recipient) => {
      if (seen.has(recipient.id)) {
        return false;
      }
      seen.add(recipient.id);
      return true;
    });
  }, [recipients]);
  const [messageData, setMessageData] = useState<MessageData>({
    messageContent: "",
    isAdDisplayed: false,
    images: [],
    messageSubType: CrmMessageSubType.SMS,
    messageType: CrmMessageType.문자,
  });
  const [isTemplateListModalOpen, setIsTemplateListModalOpen] = useState(false);

  // 발송 관련 상태
  const [sendRequest, setSendRequest] = useState<CrmMessageSendRequest | null>(
    null
  );
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const debouncedSendRequest = useDebounce(sendRequest, 500);

  // CRM 메시지 발송 mutation
  const sendMessageMutation = useSendMessage({
    onSuccess: () => {
      toastHelpers.success("발송되었습니다.");
      handleClose();
    },
    onError: () => {
      toastHelpers.error("발송이 실패하였습니다.");
    },
  });

  useEffect(() => {
    if (!debouncedSendRequest || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(debouncedSendRequest);
    setSendRequest(null);
  }, [debouncedSendRequest, sendMessageMutation.mutate]);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const convertToMessageRecipient = useCallback(
    (recipient: QuickMessageRecipient): CrmMessageRecipient => {
      return {
        patientId: recipient.id,
        recipientName: recipient.name,
      };
    },
    []
  );

  // 발송 설정 상태
  const [sendSettings, setSendSettings] = useState<SendSettingsData>({
    isReserved: false,
    senderNumber: "",
  });

  // 발송 설정 업데이트 핸들러
  const updateSendSettings = useCallback(
    (updates: Partial<SendSettingsData>) => {
      setSendSettings((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // 개별 설정 핸들러들
  const sendSettingsHandlers: SendSettingsHandlers = {
    setIsReserved: (isReserved) => updateSendSettings({ isReserved }),
    setSendDate: (date) => updateSendSettings({ sendDate: date }),
    setSendTime: (time) => updateSendSettings({ sendTime: time }),
    setSenderNumber: (number) => updateSendSettings({ senderNumber: number }),
  };

  const handleMessageDataChange = (newMessageData: MessageData) => {
    setMessageData(newMessageData);
  };

  const handleTemplateConfirm = useCallback(
    async (template: GetTemplateResponseDto, isGuideTemplate: boolean) => {
      let images = messageData.images || [];

      // messageImageFileinfo가 있으면 파일 다운로드
      if (
        template.messageImageFileinfo &&
        template.messageImageFileinfo.length > 0
      ) {
        try {
          const imagePromises = template.messageImageFileinfo.map(
            async (fileInfo) => {
              const response = await FileService.downloadFileV2(fileInfo.uuid);

              // Blob을 File 객체로 변환
              const file = new File(
                [response.blob],
                response.filename || `image-${fileInfo.id}.png`,
                { type: response.contentType || response.blob.type }
              );

              // Preview URL 생성
              const preview = URL.createObjectURL(response.blob);

              return { file, preview };
            }
          );

          images = await Promise.all(imagePromises);
        } catch (error) {
          console.error("템플릿 이미지 다운로드 실패:", error);
          toastHelpers.error("템플릿 이미지를 불러오는데 실패했습니다.");
        }
      } else {
        images = [];
      }

      setMessageData({
        ...messageData,
        messageTemplateId: template.id,
        messageContent: template.messageContent,
        isAdDisplayed: template.isAdDisplayed,
        isGuideTemplate: isGuideTemplate,
        messageImageFileinfo: template.messageImageFileinfo,
        images: images,
      });
      setIsTemplateListModalOpen(false);
    },
    [messageData, toastHelpers]
  );

  const handleConfirm = useCallback(() => {
    if (uniqueRecipients.length === 0) {
      showAlert("발송 대상이 없습니다.");
      return;
    }
    if (!messageData.messageContent) {
      showAlert("메시지 내용을 입력하세요.");
      return;
    }

    const request: CrmMessageSendRequest = {
      recipients: uniqueRecipients.map(convertToMessageRecipient),
      messageType: messageData.messageType,
      messageContent: messageData.messageContent,
      isAdDisplayed: messageData.isAdDisplayed,
      messageTemplateId: messageData.messageTemplateId,
      sendType: CrmSendType.수동발송,
      senderNumber: sendSettings.senderNumber,
      // 예약 발송인 경우 sendDateTime 필드 추가 (ISO 8601 KST 형식)
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

    if (onConfirm) {
      onConfirm(messageData);
    }
  }, [
    uniqueRecipients,
    messageData,
    sendSettings,
    convertToMessageRecipient,
    onConfirm,
  ]);

  const handleClose = () => {
    // 팝업 닫을 때 상태 초기화
    setMessageData({
      messageContent: "",
      isAdDisplayed: false,
      images: [],
      messageSubType: CrmMessageSubType.SMS,
      messageType: CrmMessageType.문자,
    });
    setSendSettings({
      isReserved: false,
      senderNumber: "",
    });
    onClose();
  };

  return (
    <>
      <MyPopup
        isOpen={isOpen}
        onCloseAction={handleClose}
        title="빠른 문자 발송"
        width="420px"
        height="910px"
      >
        <div className="flex flex-col h-full">
          {/* 메인 영역 */}
          <div className="flex-1 min-h-0">
            <QuickMessageForm
              messageData={messageData}
              onMessageDataChange={handleMessageDataChange}
              onTemplateSelectClick={() => setIsTemplateListModalOpen(true)}
              sendSettings={sendSettings}
              sendSettingsHandlers={sendSettingsHandlers}
              recipients={uniqueRecipients}
              onRecipientRemove={onRecipientRemove}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 p-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={sendMessageMutation.isPending}
              className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sendMessageMutation.isPending ? "발송 중..." : "발송"}
            </button>
          </div>
        </div>
      </MyPopup>

      {/* 템플릿 선택 모달 */}
      <TemplateListModal
        isOpen={isTemplateListModalOpen}
        onClose={() => setIsTemplateListModalOpen(false)}
        messageType={CrmMessageType.문자}
        onConfirm={handleTemplateConfirm}
      />

      {/* 알림 팝업 */}
      <MyPopupMsg
        isOpen={isAlertOpen}
        onCloseAction={() => setIsAlertOpen(false)}
        title="알림"
        msgType="warning"
        message={alertMessage}
        confirmText="확인"
      />
    </>
  );
};

export default QuickSendMessageForm;
