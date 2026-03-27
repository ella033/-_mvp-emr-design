"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToastHelpers } from "@/components/ui/toast";
import { FileService } from "@/services/file-service";
import MessageForm from "./message-form";
import TemplateListModal from "@/app/crm/_components/template/template-list";
import TemplateSaveModal from "@/app/crm/_components/template/template-save-modal";
import { CrmMessageType } from "@/constants/crm-enums";
import type { MessageData } from "@/types/crm/message-template/message-types";
import type { GetTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";

interface SendMessageFormProps {
  messageData: MessageData;
  onMessageDataChange: (messageData: MessageData) => void;
}

const SendMessageForm: React.FC<SendMessageFormProps> = ({
  messageData,
  onMessageDataChange,
}) => {
  const toastHelpers = useToastHelpers();
  const [isTemplateListModalOpen, setIsTemplateListModalOpen] = useState(false);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);

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

      onMessageDataChange({
        ...messageData,
        messageTemplateId: template.id,
        messageType: template.messageType,
        messageContent: template.messageContent,
        isAdDisplayed: template.isAdDisplayed,
        isGuideTemplate: isGuideTemplate,
        messageImageFileinfo: template.messageImageFileinfo,
        images: images,
      });
      setIsTemplateListModalOpen(false);
    },
    [messageData, onMessageDataChange, toastHelpers]
  );

  const header = (
    <>
      {/* 발송 수단 */}
      <div className="w-[50%] flex items-center justify-between">
        <h3 className="text-sm font-bold">발송 수단</h3>
        <RadioGroup
          data-testid="crm-message-type-group"
          value={messageData.messageType.toString()}
          onValueChange={(value: string) =>
            onMessageDataChange({
              ...messageData,
              messageType: parseInt(value) as CrmMessageType,
            })
          }
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={CrmMessageType.문자.toString()}
              id="sms"
              data-testid="crm-message-type-sms"
            />
            <Label htmlFor="sms" className="text-[var(--gray-300)]">
              문자
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={CrmMessageType.알림톡.toString()}
              id="kakao"
              data-testid="crm-message-type-kakao"
            />
            <Label htmlFor="kakao" className="text-[var(--gray-300)]">
              알림톡
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 템플릿 버튼 영역 */}
      <div className="w-[50%] flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">내용</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsTemplateListModalOpen(true)}
            size="sm"
            data-testid="crm-template-select-button"
            className="px-3 py-1.5 bg-[var(--main-color)]"
          >
            템플릿 선택
          </Button>
          <Button
            onClick={() => setIsTemplateSaveModalOpen(true)}
            variant="outline"
            size="sm"
            data-testid="crm-template-save-open-button"
            className="px-3 py-1.5"
          >
            템플릿 저장
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <MessageForm
        messageData={messageData}
        onMessageDataChange={onMessageDataChange}
        header={header}
        testId="crm-message-form"
      />

      {/* 템플릿 선택 모달 */}
      <TemplateListModal
        isOpen={isTemplateListModalOpen}
        onClose={() => setIsTemplateListModalOpen(false)}
        messageType={messageData.messageType}
        onConfirm={handleTemplateConfirm}
      />

      {/* 템플릿 저장 모달 */}
      <TemplateSaveModal
        isOpen={isTemplateSaveModalOpen}
        onClose={() => setIsTemplateSaveModalOpen(false)}
        messageData={messageData}
      />
    </>
  );
};

export default SendMessageForm;
