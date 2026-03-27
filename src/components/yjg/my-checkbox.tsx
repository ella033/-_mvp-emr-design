import { cn } from "@/lib/utils";
import React from "react";
import { Plus, Check } from "lucide-react";
import {
  INPUT_FOCUS_CLASS,
  CHECKBOX_LABEL_SIZE_CLASS,
  CHECKBOX_SIZE_CLASS
} from "./common/constant/class-constants";
import { MyTooltip } from "./my-tooltip";

/** TooltipTrigger asChild 시 트리거 노드가 매 렌더 새로 생성되지 않도록 ref 전달용 span (무한 업데이트 방지) */
const TooltipTriggerSpan = React.forwardRef<
  HTMLSpanElement,
  React.PropsWithChildren
>(({ children, ...props }, ref) => (
  <span ref={ref} className="inline-flex" {...props}>
    {children}
  </span>
));
TooltipTriggerSpan.displayName = "TooltipTriggerSpan";

// 버튼 타입 체크박스의 사이즈별 클래스
const BUTTON_SIZE_CLASS = {
  xs: "px-2 py-0.5 text-[11px]",
  sm: "px-2.5 py-1 text-[12px]",
  md: "px-3 py-1.5 text-[13px]",
  lg: "px-4 py-2 text-[14px]",
};

export default function MyCheckbox({
  className,
  size = "md",
  type = "checkbox",
  label,
  name,
  checked,
  onChange,
  disabled,
  readOnly,
  indeterminate,
  tooltip,
  tooltipDelayDuration = 0,
  ...props
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  type?: "checkbox" | "button";
  label?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  indeterminate?: boolean;
  tooltip?: React.ReactNode;
  tooltipDelayDuration?: number;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "size"
>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const handleButtonClick = () => {
    if (disabled || readOnly) return;
    onChange?.(!checked);
  };

  const labelSizeClass =
    CHECKBOX_LABEL_SIZE_CLASS[size as keyof typeof CHECKBOX_LABEL_SIZE_CLASS];

  const checkBoxSizeClass =
    CHECKBOX_SIZE_CLASS[size as keyof typeof CHECKBOX_SIZE_CLASS];

  const buttonSizeClass = BUTTON_SIZE_CLASS[size];

  // 버튼 타입일 경우
  if (type === "button") {
    const buttonContent = (
      <button
        type="button"
        className={cn(
          "flex items-center justify-center gap-1 rounded border border-[var(--main-color-2-1)] font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1",
          buttonSizeClass,
          checked
            ? "bg-[var(--main-color-2-1)] text-white"
            : "bg-[var(--input-bg)] text-[var(--main-color-2-1)]",
          disabled && "opacity-50 cursor-not-allowed",
          readOnly && "pointer-events-none",
          className
        )}
        onClick={handleButtonClick}
        disabled={disabled}
        aria-pressed={checked}
        aria-readonly={readOnly}
      >
        {label && <span className="whitespace-nowrap">{label}</span>}
        {checked ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
      </button>
    );

    if (tooltip) {
      return (
        <MyTooltip
          delayDuration={tooltipDelayDuration}
          content={
            <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
              {tooltip}
            </div>
          }
        >
          <TooltipTriggerSpan>{buttonContent}</TooltipTriggerSpan>
        </MyTooltip>
      );
    }

    return buttonContent;
  }

  // 기본 체크박스 타입
  const checkboxContent = (
    <label
      className={cn(
        "flex flex-row gap-1 items-center",
        disabled || readOnly ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <input
        type="checkbox"
        className={cn(
          INPUT_FOCUS_CLASS,
          checkBoxSizeClass,
          className
        )}
        name={name}
        checked={checked ?? false}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        ref={(el) => {
          if (el) {
            el.indeterminate = indeterminate || false;
          }
        }}
        {...props}
      />
      {label && (
        <div
          className={cn(
            "whitespace-nowrap",
            labelSizeClass,
            disabled && "text-[var(--gray-700)]"
          )}
        >
          {label}
        </div>
      )}
    </label>
  );

  if (tooltip) {
    return (
      <MyTooltip
        delayDuration={tooltipDelayDuration}
        content={
          <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
            {tooltip}
          </div>
        }
      >
        {/* span wrapper로 감싸서 TooltipTrigger의 asChild가 제대로 작동하도록 함 */}
        <span className="inline-flex">{checkboxContent}</span>
      </MyTooltip>
    );
  }

  return checkboxContent;
}
