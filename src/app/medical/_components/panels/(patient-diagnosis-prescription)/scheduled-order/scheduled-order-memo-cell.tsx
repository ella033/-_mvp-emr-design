"use client";

import { useState, useRef, useEffect } from "react";
import MyDropDown from "@/components/yjg/my-drop-down";
import MyInput from "@/components/yjg/my-input";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyButton } from "@/components/yjg/my-button";
import { ScheduledOrderMemoIcon } from "@/components/custom-icons";
interface ScheduledOrderMemoCellProps {
  memo: string;
  onMemoChangeAction: (value: string) => void;
}

export default function ScheduledOrderMemoCell({
  memo,
  onMemoChangeAction,
}: ScheduledOrderMemoCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localMemo, setLocalMemo] = useState(memo);
  const inputRef = useRef<HTMLInputElement>(null);

  // memo prop이 변경되면 localMemo 동기화
  useEffect(() => {
    setLocalMemo(memo);
  }, [memo]);

  // dropdown이 열릴 때 input에 포커스
  useEffect(() => {
    if (isOpen) {
      // 약간의 지연 후 포커스 (Portal 렌더링 대기)
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onMemoChangeAction(localMemo);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setLocalMemo(memo);
      setIsOpen(false);
    }
  };

  return (
    <div
      data-popup-trigger="true"
      className="flex items-center justify-center w-full h-full"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MyDropDown
        trigger={
          <MyTooltip content={localMemo || "메모 입력"}>
            <MyButton variant="ghost" size="icon" className="w-full h-full">
              <ScheduledOrderMemoIcon
                className={`w-[14px] h-[14px] ${localMemo ? "" : "opacity-50"}`}
              />
            </MyButton>
          </MyTooltip>
        }
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        fixedWidth={300}
        maxHeight={100}
      >
        <div className="p-2 flex flex-col gap-2">
          <MyInput
            ref={inputRef}
            type="text"
            value={localMemo}
            onChange={setLocalMemo}
            onKeyDown={handleKeyDown}
            placeholder="메모 입력"
            className="w-full"
          />
        </div>
      </MyDropDown>
    </div>
  );
}
