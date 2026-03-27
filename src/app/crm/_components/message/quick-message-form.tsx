"use client";

import React, { useMemo, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import MessageContent from "./message-content";
import MessageImage from "./message-image";
import "@/components/yjg/common/style/my-style.css";
import { useHospitalStore } from "@/store/hospital-store";
import { formatPhoneNumber } from "@/lib/patient-utils";
import { CrmMessageSubType } from "@/constants/crm-enums";
import type { MessageData } from "@/types/crm/message-template/message-types";
import QuickSendSettings from "./quick-send-settings";
import type {
  SendSettingsData,
  SendSettingsHandlers,
} from "@/app/crm/send/page";

// 발송 대상 타입 정의
export interface QuickMessageRecipient {
  id: number;
  name: string;
}

interface QuickMessageFormProps {
  messageData: MessageData;
  onMessageDataChange: (messageData: MessageData) => void;
  header?: React.ReactNode;
  onTemplateSelectClick?: () => void;
  sendSettings?: SendSettingsData;
  sendSettingsHandlers?: SendSettingsHandlers;
  recipients?: QuickMessageRecipient[];
  onRecipientRemove?: (id: number) => void;
}

const QuickMessageForm: React.FC<QuickMessageFormProps> = ({
  messageData,
  onMessageDataChange,
  header,
  onTemplateSelectClick,
  sendSettings,
  sendSettingsHandlers,
  recipients = [],
  onRecipientRemove,
}) => {
  const { messageContent, isAdDisplayed = false, images = [] } = messageData;
  const hospital = useHospitalStore((state) => state.hospital);
  const [isRecipientsExpanded, setIsRecipientsExpanded] = useState(false);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        if (image?.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [images]);

  const placeholders = useMemo(() => {
    const hospitalAddress = `${hospital.address1}${hospital.address2 ? ` ${hospital.address2}` : ""}`;

    return [
      { text: "환자명", group: 1, previewValue: "홍길동" },
      { text: "환자 생일", group: 1, previewValue: "00월 00일" },
      { text: "병원명", group: 2, previewValue: hospital.name },
      {
        text: "병원 전화번호",
        group: 2,
        previewValue: hospital.phone ? formatPhoneNumber(hospital.phone) : "",
      },
      { text: "병원 주소", group: 2, previewValue: hospitalAddress },
      { text: "예약일", group: 3, previewValue: "0000년 00월 00일" },
      { text: "예약 시간", group: 3, previewValue: "오후 00시 00분" },
      { text: "예약실", group: 3, previewValue: "예약실 1" },
      { text: "최근 내원일", group: 4, previewValue: "0000년 00월 00일" },
    ];
  }, [hospital.name, hospital.phone, hospital.address1, hospital.address2]);

  // EUC-KR 기준 바이트 길이 계산 함수
  const calculateByteLength = useCallback((content: string) => {
    let byteLength = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charAt(i);
      const code = char.charCodeAt(0);
      if (code > 127) {
        byteLength += 2;
      } else {
        byteLength += 1;
      }
    }
    return byteLength;
  }, []);

  // 메시지 타입 자동 결정 함수
  const determineMessageType = useCallback(
    (content: string, hasImages: boolean) => {
      const byteLength = calculateByteLength(content);

      if (hasImages) {
        return CrmMessageSubType.MMS;
      } else if (byteLength <= 90) {
        return CrmMessageSubType.SMS;
      } else {
        return CrmMessageSubType.LMS;
      }
    },
    [calculateByteLength]
  );

  const handleMessageChange = useCallback(
    (content: string) => {
      const messageSubType = determineMessageType(content, images.length > 0);

      onMessageDataChange({
        ...messageData,
        messageContent: content,
        messageSubType: messageSubType,
      });
    },
    [messageData, onMessageDataChange, images.length, determineMessageType]
  );

  const handleImagesChange = useCallback(
    (newImages: typeof images) => {
      const messageSubType = determineMessageType(
        messageContent,
        newImages.length > 0
      );

      onMessageDataChange({
        ...messageData,
        images: newImages,
        messageSubType: messageSubType,
      });
    },
    [messageData, onMessageDataChange, messageContent, determineMessageType]
  );

  return (
    <div className="h-full flex flex-col">
      {/* 발송 대상 섹션 */}
      {recipients.length > 0 &&
        (() => {
          const firstRecipient = recipients[0];
          if (!firstRecipient) return null;

          return (
            <div className="px-4 pt-4 relative">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">발송 대상</h2>
                <div className="flex items-center gap-1">
                  {recipients.length === 1 ? (
                    <span className="text-sm text-[var(--second-color)] font-bold">
                      {firstRecipient.name} ({firstRecipient.id})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setIsRecipientsExpanded(!isRecipientsExpanded)
                      }
                      className="flex items-center gap-1 text-sm hover:opacity-80"
                    >
                      <span className="text-[var(--second-color)] font-bold">
                        {firstRecipient.name} ({firstRecipient.id})
                      </span>
                      <span>외 </span>
                      <span className="text-[var(--second-color)] font-bold">
                        {recipients.length - 1}
                      </span>
                      <span>명</span>
                      {isRecipientsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 대상자 리스트 (펼침 상태일 때) */}
              {isRecipientsExpanded && recipients.length > 1 && (
                <div className="absolute left-0 right-0 top-full z-50 mx-4 mt-2 p-3 bg-white border border-[var(--border-1)] rounded-md shadow-lg">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 max-h-[200px] overflow-y-auto">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between bg-[var(--bg-1)] px-2 py-1.5 rounded-md"
                      >
                        <span className="text-sm text-[var(--text-secondary)]">
                          {recipient.name} ({recipient.id})
                        </span>
                        {onRecipientRemove && (
                          <button
                            type="button"
                            onClick={() => onRecipientRemove(recipient.id)}
                            className="text-[var(--gray-400)] hover:text-[var(--gray-200)] p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* 메시지 헤더 */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">내용</h2>
        {onTemplateSelectClick && (
          <Button
            onClick={onTemplateSelectClick}
            size="sm"
            variant="outline"
            className="px-3 py-1.5"
          >
            템플릿 선택
          </Button>
        )}
      </div>

      <div className="flex">
        <div className="flex-1 flex flex-col px-4 py-1 gap-3">
          {header}

          {/* 메시지 작성 및 플레이스홀더 영역 */}
          <div className="w-full">
            <MessageContent
              messageContent={messageContent}
              onMessageChange={handleMessageChange}
              placeholders={placeholders}
              hasImage={images.length > 0}
              className="h-[418px]"
            />
          </div>

          {/* 이미지 */}
          <div className="w-full">
            <MessageImage images={images} onImagesChange={handleImagesChange} />
          </div>

          {/* 광고 여부 */}
          <div className="w-full flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold">광고 여부</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ad-message"
                checked={isAdDisplayed}
                onCheckedChange={useCallback(
                  (checked: boolean) =>
                    onMessageDataChange({
                      ...messageData,
                      isAdDisplayed: checked,
                    }),
                  [messageData, onMessageDataChange]
                )}
              />
              <Label htmlFor="ad-message">광고성 메시지</Label>
            </div>
          </div>

          {/* 발송 설정 */}
          {sendSettings && sendSettingsHandlers && (
            <QuickSendSettings
              sendSettings={sendSettings}
              sendSettingsHandlers={sendSettingsHandlers}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickMessageForm;
