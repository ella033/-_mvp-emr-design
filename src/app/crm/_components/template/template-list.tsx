"use client";

import React, { useState, useEffect } from "react";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import { useGuideMessageTemplateFolders } from "@/hooks/crm/use-guide-message-template-folders";
import { useUserMessageTemplateFolders } from "@/hooks/crm/use-user-message-template-folders";
import { useGuideMessageTemplatesByFolder } from "@/hooks/crm/use-guide-message-templates-by-folder";
import { useUserMessageTemplatesByFolder } from "@/hooks/crm/use-user-message-templates-by-folder";
import TemplatePreview from "./template-preview";
import MyPopup from "@/components/yjg/my-pop-up";
import type { GetTemplateResponseDto } from "@/types/crm/message-template/crm-user-message-template-types";

interface TemplateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageType: number;
  onConfirm: (
    template: GetTemplateResponseDto,
    isGuideTemplate: boolean
  ) => void;
  fixedTemplateType?: "guide" | "user";
}

const TemplateListModal: React.FC<TemplateListModalProps> = ({
  isOpen,
  onClose,
  messageType,
  onConfirm,
  fixedTemplateType,
}) => {
  const [activeTemplateType, setActiveTemplateType] = useState<string>(
    fixedTemplateType || "guide"
  );
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    id: number;
    isGuideTemplate: boolean;
  } | null>(null);

  // fixedTemplateType이 설정된 경우 activeTemplateType을 고정
  useEffect(() => {
    if (fixedTemplateType) {
      setActiveTemplateType(fixedTemplateType);
    }
  }, [fixedTemplateType]);

  // 템플릿 타입이 변경되면 선택된 폴더와 템플릿 초기화
  useEffect(() => {
    setSelectedFolderId(null);
    setSelectedTemplate(null);
  }, [activeTemplateType]);

  // 추천 템플릿 폴더 조회
  const {
    data: guideFolders,
    isLoading: isLoadingGuide,
    error: guideError,
    refetch: refetchGuideFolders,
  } = useGuideMessageTemplateFolders(messageType);

  // 내 템플릿 폴더 조회
  const {
    data: userFolders,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUserFolders,
  } = useUserMessageTemplateFolders(messageType);

  // 모달이 열릴 때 폴더 목록을 최신 데이터로 갱신
  useEffect(() => {
    if (isOpen) {
      refetchGuideFolders();
      refetchUserFolders();
    }
  }, [isOpen, refetchGuideFolders, refetchUserFolders]);

  const templateTypeButtons: ButtonGroupItem[] = [
    { id: "guide", title: "추천 템플릿" },
    { id: "user", title: "내 템플릿" },
  ];

  const currentFolders =
    activeTemplateType === "guide" ? guideFolders : userFolders;
  const isLoading =
    activeTemplateType === "guide" ? isLoadingGuide : isLoadingUser;
  const error = activeTemplateType === "guide" ? guideError : userError;

  // 선택된 폴더의 템플릿 목록 조회
  const {
    data: guideTemplates,
    isLoading: isLoadingGuideTemplates,
    error: guideTemplatesError,
  } = useGuideMessageTemplatesByFolder(selectedFolderId || 0);

  const {
    data: userTemplates,
    isLoading: isLoadingUserTemplates,
    error: userTemplatesError,
  } = useUserMessageTemplatesByFolder(selectedFolderId || 0);

  const currentTemplates =
    activeTemplateType === "guide" ? guideTemplates : userTemplates;
  const isLoadingTemplates =
    activeTemplateType === "guide"
      ? isLoadingGuideTemplates
      : isLoadingUserTemplates;
  const templatesError =
    activeTemplateType === "guide" ? guideTemplatesError : userTemplatesError;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title="템플릿 선택"
      width="980px"
      height="720px"
    >
      <div className="flex flex-col h-full p-4">
        {/* 메인 영역 */}
        <div className="flex flex-1 gap-4 min-h-0">
          {/* 좌측 영역 - 폴더 목록 */}
          <div className="flex flex-col w-1/5 gap-3">
            {/* 버튼 그룹 - fixedTemplateType이 없을 때만 표시 */}
            {!fixedTemplateType && (
              <ButtonGroup
                buttons={templateTypeButtons}
                activeButtonId={activeTemplateType}
                onButtonChangeAction={setActiveTemplateType}
                className="text-sm"
              />
            )}

            {/* 폴더 목록 */}
            <div className="flex-1 rounded-md overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-[var(--gray-300)]">
                    로딩 중...
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-red-500">
                    템플릿 카테고리를 불러오는데 실패했습니다.
                  </span>
                </div>
              ) : currentFolders && currentFolders.length > 0 ? (
                <ul>
                  {currentFolders.map((folder) => (
                    <li
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`my-2 px-4 py-3 cursor-pointer rounded-md transition-colors ${
                        selectedFolderId === folder.id
                          ? "bg-[var(--violet-1)]"
                          : ""
                      }`}
                    >
                      <span
                        className={`text-sm text-[var(--gray-300)] ${
                          selectedFolderId === folder.id ? "font-bold" : ""
                        }`}
                      >
                        {folder.name}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-[var(--gray-300)]">
                    템플릿 카테고리가 없습니다.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-[var(--border-1)]" />

          {/* 우측 영역 - 템플릿 상세 */}
          <div className="w-4/5 flex flex-col">
            {selectedFolderId ? (
              <div className="flex-1 overflow-y-auto">
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm text-[var(--gray-300)]">
                      템플릿 로딩 중...
                    </span>
                  </div>
                ) : templatesError ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm text-red-500">
                      템플릿을 불러오는데 실패했습니다.
                    </span>
                  </div>
                ) : currentTemplates && currentTemplates.length > 0 ? (
                  <div className="grid grid-cols-3 gap-5 p-4">
                    {currentTemplates.map((template) => (
                      <div key={template.id}>
                        <TemplatePreview
                          title={template.name}
                          content={template.messageContent}
                          messageSubTypeName={template.messageSubTypeName}
                          messageImageFileinfo={template.messageImageFileinfo}
                          isSelected={
                            selectedTemplate?.id === template.id &&
                            selectedTemplate?.isGuideTemplate ===
                              (activeTemplateType === "guide")
                          }
                          onClick={() =>
                            setSelectedTemplate({
                              id: template.id,
                              isGuideTemplate: activeTemplateType === "guide",
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-sm text-[var(--gray-300)]">
                      템플릿이 없습니다.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-sm text-[var(--gray-300)]">
                  카테고리를 선택해주세요.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedTemplate) {
                alert("템플릿을 선택해주세요.");
                return;
              }
              const template = currentTemplates?.find(
                (t) => t.id === selectedTemplate.id
              );
              if (template) {
                onConfirm(template, selectedTemplate.isGuideTemplate);
              }
            }}
            className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
          >
            선택
          </button>
        </div>
      </div>
    </MyPopup>
  );
};

export default TemplateListModal;
