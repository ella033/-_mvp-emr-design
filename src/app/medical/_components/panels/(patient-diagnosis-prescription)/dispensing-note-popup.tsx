"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { useInputSlashCommand } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/use-input-slash-command";
import { TextareaSlashCommandPopup } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/textarea-slash-command-popup";

export default function DispensingNotePopup({
  isOpen,
  onCloseAction,
  value,
  onChangeAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
  value: string;
  onChangeAction: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 팝업이 열릴 때 value로 로컬 상태 동기화
  useEffect(() => {
    if (isOpen) {
      setLocalValue(value);
    }
  }, [isOpen, value]);

  const {
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown: slashHandleKeyDown,
    handleInputChange,
  } = useInputSlashCommand({
    templateCodeType: TemplateCodeType.조제시참고사항,
    currentValue: localValue,
    externalInputRef: textareaRef,
    onInsert: (newValue) => setLocalValue(newValue),
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      const cursorPos = e.target.selectionStart ?? v.length;
      setLocalValue(v);
      handleInputChange(v, cursorPos);
    },
    [handleInputChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      slashHandleKeyDown(e);
      if (e.key === "Enter") {
        e.stopPropagation();
      }
    },
    [slashHandleKeyDown]
  );

  const handleTemplateClick = useCallback((template: TemplateCode) => {
    const stripped = stripHtmlTags(template.content);
    setLocalValue((prev) => prev + stripped);
  }, []);

  const handleCancel = useCallback(() => {
    onCloseAction();
  }, [onCloseAction]);

  const handleSave = useCallback(() => {
    onChangeAction(localValue);
    onCloseAction();
  }, [localValue, onChangeAction, onCloseAction]);

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      title="조제시참고사항"
      width="400px"
      height="300px"
      minWidth="300px"
      minHeight="250px"
      alwaysCenter={true}
    >
      <div className="flex flex-col h-full min-h-0 p-[8px] gap-[8px]">
        <div className="flex-1 min-h-0 flex flex-col border border-[var(--border-1)] rounded-md overflow-hidden">
          <textarea
            ref={textareaRef}
            className="flex-1 w-full resize-none p-3 text-[12px] outline-none bg-[var(--card-bg)]"
            placeholder="조제시참고사항을 입력해주세요. ('/' 입력하여 상용구 검색)"
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <TemplateCodeQuickBar
            templateCodeType={TemplateCodeType.조제시참고사항}
            onTemplateClickAction={handleTemplateClick}
            className="p-[3px]"
          />
        </div>
        <TextareaSlashCommandPopup
          ref={commandListRef}
          isOpen={slashState.isOpen}
          position={slashState.position}
          items={commandItems}
          onSelect={(item) =>
            item.command({ editor: null as any, range: null as any })
          }
        />
        <div className="flex justify-end gap-2">
          <MyButton variant="outline" onClick={handleCancel}>
            취소
          </MyButton>
          <MyButton onClick={handleSave}>저장</MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
