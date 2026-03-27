"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToastHelpers } from "@/components/ui/toast";
import { FileService } from "@/services/file-service";
import MessageForm from "./message-form";
import TemplateListModal from "@/app/crm/_components/template/template-list";
import type { MessageData } from "@/types/crm/message-template/message-types";
import type { GetTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

interface TemplateMessageFormProps {
  messageData: MessageData;
  onMessageDataChange: (messageData: MessageData) => void;
  templateData?: GetTemplateResponseDto;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  onDelete?: () => void;
}

const TemplateMessageForm: React.FC<TemplateMessageFormProps> = ({
  messageData,
  onMessageDataChange,
  templateData,
  templateName,
  onTemplateNameChange,
  onDelete,
}) => {
  const toastHelpers = useToastHelpers();
  const [isTemplateListModalOpen, setIsTemplateListModalOpen] = useState(false);

  // 이미지 다운로드 공통 함수
  const downloadTemplateImages = async (
    messageImageFileinfo: FileUploadV2Uuid[]
  ) => {
    try {
      const imagePromises = messageImageFileinfo.map(async (fileInfo) => {
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
      });

      return await Promise.all(imagePromises);
    } catch (error) {
      console.error("템플릿 이미지 다운로드 실패:", error);
      toastHelpers.error("템플릿 이미지를 불러오는데 실패했습니다.");
      return [];
    }
  };

  // 템플릿 데이터가 변경될 때 메시지 데이터 업데이트
  useEffect(() => {
    const updateMessageDataFromTemplate = async () => {
      if (templateData) {
        let images: any[] = [];

        // messageImageFileinfo가 있으면 파일 다운로드
        if (
          templateData.messageImageFileinfo &&
          templateData.messageImageFileinfo.length > 0
        ) {
          images = await downloadTemplateImages(
            templateData.messageImageFileinfo
          );
        }

        onMessageDataChange({
          messageType: templateData.messageType,
          messageContent: templateData.messageContent,
          messageSubType: templateData.messageSubType,
          isAdDisplayed: templateData.isAdDisplayed,
          messageTemplateId: templateData.id,
          isGuideTemplate: false,
          images: images,
          messageImageFileinfo: templateData.messageImageFileinfo, // 기존 이미지 정보 보존
        });

        // 템플릿명 설정
        onTemplateNameChange(templateData.name);
      }
    };

    updateMessageDataFromTemplate();
  }, [templateData]);

  const handleTemplateConfirm = useCallback(
    async (template: GetTemplateResponseDto, isGuideTemplate: boolean) => {
      let images = messageData.images || [];

      // messageImageFileinfo가 있으면 파일 다운로드
      if (
        template.messageImageFileinfo &&
        template.messageImageFileinfo.length > 0
      ) {
        images = await downloadTemplateImages(template.messageImageFileinfo);
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
        images: images,
      });
      setIsTemplateListModalOpen(false);
    },
    [messageData, onMessageDataChange, toastHelpers]
  );

  const handleDeleteTemplate = () => {
    if (!window.confirm("삭제하시겠습니까?")) {
      return;
    }
    onDelete?.();
  };

  const header = (
    <>
      {/* 템플릿명 및 삭제 버튼 */}
      <div className="w-full flex items-end gap-4">
        <div className="flex-1">
          <Label
            htmlFor="templateName"
            className="text-sm text-[var(--gray-100)] mb-1"
          >
            템플릿명
          </Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            className="w-full"
            placeholder="템플릿명을 입력하세요"
          />
        </div>
        <Button
          variant="outline"
          className="px-5 py-1.5 text-sm text-[var(--gray-100)] border-[var(--border-1)] rounded"
          onClick={handleDeleteTemplate}
        >
          템플릿 삭제
        </Button>
      </div>

      {/* 템플릿 버튼 영역 */}
      <div className="w-[52%] flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">내용</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsTemplateListModalOpen(true)}
            size="sm"
            className="px-3 py-2 bg-[var(--main-color)]"
          >
            추천 템플릿 불러오기
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
      />

      {/* 템플릿 선택 모달 */}
      <TemplateListModal
        isOpen={isTemplateListModalOpen}
        onClose={() => setIsTemplateListModalOpen(false)}
        messageType={messageData.messageType}
        onConfirm={handleTemplateConfirm}
        fixedTemplateType="guide"
      />
    </>
  );
};

export default TemplateMessageForm;
