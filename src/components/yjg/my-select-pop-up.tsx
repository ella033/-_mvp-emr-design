import { useState } from "react";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { ChevronDownIcon } from "lucide-react";
import MyPopup from "@/components/yjg/my-pop-up";
import React from "react";
import { cn } from "@/lib/utils";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
} from "./common/constant/class-constants";

export interface MySelectPopUpOption {
  value: string;
  label: string;
  description?: string;
}

export interface MySelectPopUpProps {
  children?: React.ReactNode;
  value: string;
  title: string;
  options: MySelectPopUpOption[];
  onChange: (selected: MySelectPopUpOption) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  isShowValue?: boolean;
}

export default function MySelectPopUp({
  children,
  value,
  title,
  options,
  onChange,
  disabled,
  size = "md",
  className,
  isShowValue,
}: MySelectPopUpProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value);

  const sizeClasses = {
    xs: "text-[8px] px-[2px] py-[1px]",
    sm: "text-[10px] px-[3px] py-[1px]",
    md: "text-[12px] px-[6px] py-[3px]",
    lg: "text-[14px] px-[8px] py-[4px]",
  };

  return (
    <div className="relative w-full">
      <MyTooltip
        side="left"
        align="start"
        className="max-w-[300px]"
        content={
          selected && selected.value !== "none" ? (
            <div className="flex flex-col gap-1 items-center">
              <div className="font-bold">
                {isShowValue && selected.value !== "" && `${selected.value} - `}
                {selected.value}
              </div>
              <div className="text-sm text-left whitespace-pre-line leading-relaxed break-words">
                {selected.description}
              </div>
            </div>
          ) : null
        }
      >
        {children ? (
          React.isValidElement(children) ? (
            React.cloneElement(children as React.ReactElement<any>, { setOpen })
          ) : (
            children
          )
        ) : (
          <button
            type="button"
            className={cn(
              INPUT_COMMON_CLASS,
              INPUT_FOCUS_CLASS,
              sizeClasses[size],
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "appearance-none cursor-pointer my-scroll",
              "w-auto min-w-fit",
              className
            )}
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
          >
            <div className="flex items-center justify-between gap-2 w-full">
              {selected &&
                selected.value !== "none" &&
                selected.value !== "" ? (
                <div>
                  {isShowValue && `${selected.value} : `}
                  {selected.label}
                </div>
              ) : (
                <span style={{ color: "var(--text-tertiary)" }}>-</span>
              )}
              <ChevronDownIcon
                className="w-4 h-4"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
          </button>
        )}
      </MyTooltip>

      <MyPopup
        isOpen={open}
        width="500px"
        onCloseAction={() => setOpen(false)}
        title={title}
      >
        <div className="flex-1 my-scroll">
          {options.map((opt) => (
            <button
              key={opt.value}
              className="cursor-pointer block w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-[var(--bg-tertiary)]"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt);
                setOpen(false);
              }}
            >
              <div className="font-bold">
                {isShowValue && opt.value !== "" && `${opt.value} - `}
                {opt.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400  whitespace-pre-line leading-relaxed break-words">
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </MyPopup>
    </div>
  );
}
