"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ToggleButtonProps = {
  leftLabel: string;
  rightLabel: string;
  leftCount: number;
  rightCount: number;
  selected: "left" | "right";
  onChange: (selected: "left" | "right") => void;
  className?: string;
  width?: number;
};

function ToggleButton({
  leftLabel,
  rightLabel,
  leftCount,
  rightCount,
  selected,
  onChange,
  className,
  width,
}: ToggleButtonProps) {
  return (
    <div
      className={cn(
        "flex w-full bg-[var(--bg-secondary)] shadow-sm",
        className
      )}
      style={{ width: width ? Math.max(width, 120) : undefined }}
    >
      <button
        type="button"
        className={cn(
          "flex w-1/2 items-center justify-center gap-1 rounded-[4px] px-4 py-2 text-[14px] font-semibold transition-colors cursor-pointer",
          selected === "left"
            ? "bg-[var(--card)]"
            : "bg-transparent text-gray-500"
        )}
        onClick={() => onChange("left")}
      >
        {leftLabel}
        <span className="text-[#F26A1A]">{leftCount}</span>
      </button>
      <button
        type="button"
        className={cn(
          "flex w-1/2 items-center justify-center gap-1 rounded-[4px] px-4 py-2 text-[14px] font-semibold transition-colors cursor-pointer",
          selected === "right"
            ? "bg-[var(--card)]"
            : "bg-transparent text-gray-500"
        )}
        onClick={() => onChange("right")}
      >
        {rightLabel}
        <span className="text-[#F26A1A]">{rightCount}</span>
      </button>
    </div>
  );
}

export { ToggleButton };
