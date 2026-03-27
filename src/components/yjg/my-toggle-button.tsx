"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MyTooltip } from "./my-tooltip";

export interface MyToggleButtonOption {
  value: string | number;
  label: React.ReactNode;
  tooltip?: string;
}

export interface MyToggleButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "value"
  > {
  options: MyToggleButtonOption[];
  value: string | number | null;
  onValueChange: (value: string | number | null) => void;
  selectedClassName?: string;
  unselectedClassName?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  unSelectEnabled?: boolean;
}

// 토글 버튼 컴포넌트를 별도로 분리
const ToggleButtonContent = React.forwardRef<
  HTMLButtonElement,
  MyToggleButtonProps
>(
  (
    {
      options,
      value,
      onValueChange,
      selectedClassName,
      unselectedClassName,
      size = "default",
      className,
      disabled,
      unSelectEnabled = true,
      ...props
    },
    ref
  ) => {
    const defaultSelectedClass = unSelectEnabled
      ? "font-bold text-[var(--fg-main)]"
      : "";
    const defaultUnselectedClass = "text-[var(--gray-700)]";

    const handleClick = () => {
      if (value === null) {
        // value가 null이면 첫 번째 옵션 선택
        onValueChange(options[0]?.value || "");
      } else {
        const currentIndex = options.findIndex(
          (option) => option.value === value
        );
        const nextIndex = (currentIndex + 1) % options.length;

        if (nextIndex === 0) {
          // 마지막 옵션에서 첫 번째로 돌아올 때
          if (unSelectEnabled) {
            // 선택안함 기능이 활성화되어 있으면 null로 설정
            onValueChange(null);
          } else {
            // 선택안함 기능이 비활성화되어 있으면 첫 번째 옵션 유지
            onValueChange(options[0]?.value || "");
          }
        } else {
          // 다음 옵션으로 이동
          onValueChange(options[nextIndex]?.value || "");
        }
      }
    };

    const sizeClass = {
      xs: "text-[8px] rounded-[2px] px-[4px] py-[2px]",
      sm: "text-[10px] rounded-[4px] px-[4px] py-[2px]",
      default: "text-[12px] rounded-[6px] px-[6px] py-[3px]",
      lg: "text-[14px] rounded-[8px] px-[8px] py-[4px]",
      xl: "text-[16px] rounded-[10px] px-[10px] py-[5px]",
    }

    const displayText = value
      ? options.find((option) => option.value === value)?.label || value
      : options[0]?.label;
    // unSelectEnabled가 false이면 항상 선택된 상태로 표시
    const isSelected = value !== null || !unSelectEnabled;

    return (
      <button
        className={cn(
          "flex items-center justify-center whitespace-nowrap font-medium rounded-sm transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer border border-[var(--input-border)]",
          isSelected
            ? selectedClassName || defaultSelectedClass
            : unselectedClassName || defaultUnselectedClass,
          sizeClass[size],
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {displayText}
      </button>
    );
  }
);

ToggleButtonContent.displayName = "ToggleButtonContent";

const MyToggleButton = React.forwardRef<HTMLButtonElement, MyToggleButtonProps>(
  ({ ...props }, ref) => {
    const tooltipContent = React.useMemo(() => {
      const currentTooltip =
        props.options.find((option) => option.value === props.value)?.tooltip ||
        props.options[0]?.tooltip;
      if (currentTooltip) {
        return (
          <div className="text-sm max-w-[300px] whitespace-pre-wrap">
            {currentTooltip}
          </div>
        );
      }
      return null;
    }, [props.value, props.options]);

    return (
      <MyTooltip content={tooltipContent} delayDuration={500}>
        <ToggleButtonContent ref={ref} {...props} />
      </MyTooltip>
    );
  }
);

MyToggleButton.displayName = "MyToggleButton";

export { MyToggleButton };
