"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MyPopup, { MyPopupMsg, MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useUserMessageTemplateFolders } from "@/hooks/crm/use-user-message-template-folders";
import { useCreateUserMessageTemplate } from "@/hooks/crm/use-create-user-message-template";
import { useQueryClient } from "@tanstack/react-query";
import { useToastHelpers } from "@/components/ui/toast";
import { FileService } from "@/services/file-service";
import type { MessageData } from "@/types/crm/message-template/message-types";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageData: MessageData;
}

const TemplateSaveModal: React.FC<TemplateSaveModalProps> = ({
  isOpen,
  onClose,
  messageData,
}) => {
  const toastHelpers = useToastHelpers();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);

  const {
    messageType,
    messageContent,
    messageSubType,
    isAdDisplayed = false,
    images = [],
  } = messageData;

  // 내 템플릿 폴더 목록 조회
  const { data: userFolders, isLoading: isLoadingFolders } =
    useUserMessageTemplateFolders(messageType);

  // 템플릿 생성 mutation
  const createTemplate = useCreateUserMessageTemplate({
    onSuccess: () => {
      toastHelpers.success("템플릿이 저장되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-hierarchy", messageType],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-templates-by-folder"],
      });
      queryClient.invalidateQueries({
        queryKey: ["crm-user-message-template-folders"],
      });
      onClose();
      setSelectedCategoryId("");
      setTemplateName("");
    },
    onError: (error) => {
      console.error("템플릿 생성 실패:", error.message);
      toastHelpers.error("템플릿 저장에 실패했습니다.");
    },
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId("");
      setTemplateName("");
    }
  }, [isOpen]);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  const handleTemplateSave = async () => {
    if (!selectedCategoryId) {
      showAlert("카테고리를 선택해주세요.");
      return;
    }
    if (!templateName.trim()) {
      showAlert("템플릿명을 입력해주세요.");
      return;
    }
    if (!messageContent.trim()) {
      showAlert("메시지 내용을 입력해주세요.");
      return;
    }

    let messageImageFileinfo: FileUploadV2Uuid[] = [];

    if (images.length > 0) {
      try {
        // 첨부 이미지 업로드
        const uploadPromises = images.map((image) =>
          FileService.uploadFileV2({
            file: image.file,
            category: "message_attachment",
            entityType: "crm_message",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);

        // 업로드 결과 데이터에서 { id, uuid }만 변환
        messageImageFileinfo = uploadResults.map((result) => ({
          id: result.id,
          uuid: result.uuid,
        }));
      } catch (error) {
        // 업로드 실패 시 messageImageFileinfo는 빈 배열로 유지
        console.error("이미지 업로드 실패:", error);
        toastHelpers.error("첨부 이미지 등록이 실패하였습니다.");
      }
    }

    // 템플릿 저장 API 호출 (업로드 성공/실패와 관계없이 실행)
    createTemplate.mutate({
      messageType: messageType,
      name: templateName,
      parentId: parseInt(selectedCategoryId),
      messageContent: messageContent,
      messageSubType: messageSubType,
      isAdDisplayed: isAdDisplayed,
      messageImageFileinfo: messageImageFileinfo,
      guideMessageTemplateId: undefined,
    });
  };

  const handleCancel = () => {
    onClose();
    setSelectedCategoryId("");
    setTemplateName("");
  };

  return (
    <>
      <MyPopup
        isOpen={isOpen}
        onCloseAction={handleCancel}
        title="템플릿 저장"
        width="400px"
        height="280px"
      >
        <div className="flex flex-col h-full p-4">
          {/* 본문 영역 */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 카테고리 */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="category"
                className="text-sm text-[var(--gray-100)]"
              >
                카테고리
              </Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingFolders ? (
                    <div className="px-2 py-1.5 text-sm text-[var(--gray-300)]">
                      로딩 중...
                    </div>
                  ) : userFolders && userFolders.length > 0 ? (
                    userFolders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-[var(--gray-300)]">
                      카테고리가 없습니다
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 템플릿명 */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="templateName"
                className="text-sm text-[var(--gray-100)]"
              >
                템플릿명
              </Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleTemplateSave}
              className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
            >
              저장
            </button>
          </div>
        </div>
      </MyPopup>
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

export default TemplateSaveModal;
