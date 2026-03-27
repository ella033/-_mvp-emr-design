"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import MessagePreview from "./message-preview";
import MessageContent from "./message-content";
import MessageImage from "./message-image";
import "@/components/yjg/common/style/my-style.css";
import { useHospitalStore } from "@/store/hospital-store";
import { formatPhoneNumber } from "@/lib/patient-utils";
import { CrmMessageSubType } from "@/constants/crm-enums";
import type { MessageData } from "@/types/crm/message-template/message-types";

interface MessageFormProps {
  messageData: MessageData;
  onMessageDataChange: (messageData: MessageData) => void;
  header?: React.ReactNode;
  testId?: string;
}

const MessageForm: React.FC<MessageFormProps> = ({
  messageData,
  onMessageDataChange,
  header,
  testId,
}) => {
  const { messageContent, isAdDisplayed = false, images = [] } = messageData;
  const hospital = useHospitalStore((state) => state.hospital);

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

  const previewMessage = useMemo(() => {
    let result = messageContent;
    placeholders.forEach((placeholder) => {
      const pattern = new RegExp(`{${placeholder.text}}`, "g");
      result = result.replace(pattern, placeholder.previewValue);
    });
    return result;
  }, [messageContent, placeholders]);

  return (
    <div className="h-full flex flex-col" data-testid={testId}>
      {/* 메시지 헤더 */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-bold">메시지</h2>
      </div>

      <div className="flex">
        <div className="flex-1 flex flex-col px-4 py-2 gap-4">
          {header}

          <div className="flex gap-4">
            {/* 메시지 작성 및 플레이스홀더 영역 */}
            <div className="w-[53%]">
              <MessageContent
                messageContent={messageContent}
                onMessageChange={handleMessageChange}
                placeholders={placeholders}
                hasImage={images.length > 0}
                className="h-[578px]"
                editorTestId={testId ? `${testId}-editor` : undefined}
              />
            </div>
            {/* 미리보기 */}
            <div className="pl-2 w-[47%]">
              <MessagePreview
                previewMessage={previewMessage}
                images={images}
                isAdDisplayed={isAdDisplayed}
              />
            </div>
          </div>

          {/* 이미지 */}
          <div className="w-[50%]">
            <MessageImage images={images} onImagesChange={handleImagesChange} />
          </div>

          {/* 광고 여부 */}
          <div className="w-[50%] flex items-center justify-between gap-2">
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
        </div>
      </div>
    </div>
  );
};

export default MessageForm;
