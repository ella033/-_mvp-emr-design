import MyInput from "@/components/yjg/my-input";
import { useState, useRef, useEffect } from "react";
import { getRowHeight } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export default function OrderDivideRow({
  rowKey,
  size,
  name,
  onCellDataChange,
  readOnly = false,
}: {
  rowKey: string;
  size: "xs" | "sm" | "default" | "lg" | "xl";
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
  const inputRef = useRef<HTMLInputElement>(null);

  // editMode가 되면 input에 포커스
  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  // readOnly로 들어오면 편집 모드 강제 종료
  useEffect(() => {
    if (readOnly && isEditMode) {
      setIsEditMode(false);
    }
  }, [readOnly, isEditMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (e.key === "F2") {
      e.preventDefault();
      setIsEditMode(true);
    }
  };

  const handleDataChange = () => {
    if (editName) {
      onCellDataChange?.(rowKey, "name", editName);
    }
    setIsEditMode(false);
  };

  return (
    <div
      style={{ height: `${getRowHeight(size)}px` }}
      className="flex flex-row w-full gap-1 items-center justify-center"
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (readOnly) return;
        setIsEditMode(true);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={readOnly ? -1 : 0}
    >
      {isEditMode ? (
        <>
          <DivideLine />
          <MyInput
            ref={inputRef}
            type="text"
            className="border-none rounded-none mx-1 p-1 text-center min-w-[30%]"
            value={editName}
            onChange={(value) => setEditName(value)}
            onBlur={handleDataChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleDataChange();
              }
            }}
          />
          <DivideLine />
        </>
      ) : editName?.trim() !== "" ? (
        <>
          <DivideLine />
          <div className="text-xs whitespace-nowrap">{editName}</div>
          <DivideLine />
        </>
      ) : (
        <DivideLine />
      )}
    </div>
  );
}

export function DivideLine() {
  return <hr className="w-full border-[#666] dark:border-[#999]" />;
}
