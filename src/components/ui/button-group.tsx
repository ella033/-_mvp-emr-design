"use client";

import React from "react";
import { cn } from "@/lib/utils";

// 버튼 그룹 아이템 정의
export interface ButtonGroupItem {
  id: string;
  title: string;
}

// 버튼 그룹 컴포넌트 Props
interface ButtonGroupProps {
  buttons: ButtonGroupItem[];
  activeButtonId: string;
  onButtonChangeAction: (buttonId: string) => void;
  className?: string;
  isSeparated?: boolean;
  testId?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  activeButtonId,
  onButtonChangeAction,
  className = "",
  isSeparated = false,
  testId,
}) => {
  return (
    <div
      className={`flex w-full ${className} ${isSeparated ? "gap-2" : ""}`}
      data-testid={testId}
    >
      {buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onButtonChangeAction(button.id)}
          data-testid={testId ? `${testId}-${button.id}` : undefined}
          className={cn(
            "flex flex-1 justify-center items-center gap-1 transition-colors cursor-pointer",
            "px-3 py-2 rounded",
            activeButtonId === button.id
              ? "border border-[var(--main-color)] bg-[var(--bg-main)] text-[var(--main-color)]"
              : isSeparated
                ? "bg-white text-[var(--gray-100)] border border-[var(--gray-700)]"
                : "bg-[var(--bg-3)] text-[var(--gray-400)]"
          )}
        >
          {button.title}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;
