import MyInput from "@/components/yjg/my-input";
import { getRowHeight } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { useState, useRef, useEffect, useCallback } from "react";
import { GRID_FONT_SIZE_CLASS } from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { useInputSlashCommand } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/use-input-slash-command";
import { TextareaSlashCommandPopup } from "@/components/yjg/my-tiptap-editor/custom-extension/slash-command/textarea-slash-command-popup";
import { MyTooltip } from "@/components/yjg/my-tooltip";

export default function OrderCommandOrderRow({
  size,
  rowKey,
  name,
  onCellDataChange,
  readOnly = false,
}: {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  rowKey: string;
  name: string | undefined;
  onCellDataChange?: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void;
  /** true면 표시만 하고 편집 모드로 진입하지 않음 */
  readOnly?: boolean;
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState(name);
  const myInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS];

  // 슬래시 명령어 훅
  const {
    commandListRef,
    slashState,
    commandItems,
    handleKeyDown: slashHandleKeyDown,
    handleInputChange,
    closeSlashCommand,
  } = useInputSlashCommand({
    templateCodeType: TemplateCodeType.지시오더,
    currentValue: editName,
    externalInputRef: myInputRef,
    onInsert: (content) => {
      setEditName(content);
    },
  });

  // editMode가 되면 input에 포커스 (스크롤 이동 방지)
  useEffect(() => {
    if (isEditMode && myInputRef.current) {
      myInputRef.current.focus({ preventScroll: true });
    }
  }, [isEditMode]);

  // readOnly로 들어오면 편집 모드 강제 종료 (어떤 경로로든 editMode가 켜지는 것을 방지)
  useEffect(() => {
    if (readOnly && isEditMode) {
      setIsEditMode(false);
    }
  }, [readOnly, isEditMode]);

  // isEditMode가 false가 되면 슬래시 명령어 닫기
  useEffect(() => {
    if (!isEditMode) {
      closeSlashCommand();
    }
  }, [isEditMode, closeSlashCommand]);

  const handleDataChange = useCallback(() => {
    if (editName) {
      onCellDataChange?.(rowKey, "name", editName);
    }
    setIsEditMode(false);
  }, [editName, onCellDataChange, rowKey]);

  const handleChange = useCallback(
    (value: string) => {
      setEditName(value);
      // 커서 위치는 값의 끝으로 가정
      handleInputChange(value, value.length);
    },
    [handleInputChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 슬래시 명령어가 열려있으면 해당 키 이벤트 처리
      if (slashHandleKeyDown(e)) {
        return;
      }
      if (e.key === "Enter") {
        handleDataChange();
      }
    },
    [slashHandleKeyDown, handleDataChange]
  );

  return (
    <div
      style={{ height: `${getRowHeight(size)}px` }}
      className="flex flex-row flex-nowrap w-full items-center px-[1px]"
      onClick={(e) => {
        e.stopPropagation();
        if (readOnly) return;
        setIsEditMode(true);
      }}
      tabIndex={readOnly ? -1 : 0}
    >
      {isEditMode ? (
        <>
          <MyInput
            ref={myInputRef}
            type="text"
            className={cn(sizeClass, "rounded-none border-none")}
            value={editName}
            onChange={handleChange}
            onBlur={handleDataChange}
            onKeyDown={handleKeyDown}
            isSelectAllOnFocus={false}
          />
          <TextareaSlashCommandPopup
            ref={commandListRef}
            isOpen={slashState.isOpen}
            position={slashState.position}
            items={commandItems}
            onSelect={(item) => item.command({ editor: null as any, range: null as any })}
          />
        </>
      ) : (
        <MyTooltip content={editName ?? ""} side="bottom" align="start" delayDuration={500}>
          <div
            className={cn(
              sizeClass,
              "text-[var(--command-order-color)] whitespace-nowrap overflow-hidden text-ellipsis"
            )}
          >
            {editName}
          </div>
        </MyTooltip>
      )}
    </div>
  );
}
