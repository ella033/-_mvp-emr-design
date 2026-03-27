"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { MyLoadingSpinner } from "./my-loading-spinner";
import { createPortal } from "react-dom";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
} from "./common/constant/class-constants";

export interface MySelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface MySelectProps {
  options: MySelectOption[] | undefined;
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  parentClassName?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  readOnly?: boolean;
  hideChevron?: boolean;
  isAllShowPlaceholder?: boolean;
  /** 선택된 값을 커스텀 렌더링 (trigger에 표시되는 값) */
  renderValue?: (
    value: string | number | undefined,
    selectedOption: MySelectOption | undefined
  ) => React.ReactNode;
}

const MySelect = React.forwardRef<HTMLDivElement, MySelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "-",
      loading,
      disabled,
      className,
      parentClassName,
      size = "default",
      readOnly,
      hideChevron = false,
      isAllShowPlaceholder = false,
      renderValue,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState({
      top: 0,
      left: 0,
    });
    const [isUpward, setIsUpward] = React.useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    if (!options) return null;

    const isDisabled = disabled || loading || readOnly;

    const sizeClasses = {
      xs: `text-[8px] rounded-[2px] py-[1px] ${hideChevron ? "px-[3px]" : "pl-[4px] pr-[17px]"}`,
      sm: `text-[10px] rounded-[4px] py-[2px] ${hideChevron ? "px-[4px]" : "pl-[6px] pr-[19px]"}`,
      default: `text-[12px] rounded-[6px] py-[3px] ${hideChevron ? "px-[10px]" : "pl-[8px] pr-[21px]"}`,
      lg: `text-[14px] rounded-[8px] py-[6px] ${hideChevron ? "px-[12px]" : "pl-[10px] pr-[23px]"}`,
      xl: `text-[16px] rounded-[10px] py-[8px] ${hideChevron ? "px-[14px]" : "pl-[12px] pr-[25px]"}`,
    };

    const sizeIconClasses = {
      xs: "h-[8px] w-[8px] right-[4px]",
      sm: "h-[10px] w-[10px] right-[5px]",
      default: "h-[12px] w-[12px] right-[6px]",
      lg: "h-[14px] w-[14px] right-[7px]",
      xl: "h-[16px] w-[16px] right-[8px]",
    };

    // 드롭다운 위치 계산
    React.useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // 기본 위치 계산
        let left = rect.left;
        let top = rect.bottom + 3;

        // 화면 경계 내에서 위치 조정 (가장 긴 텍스트 길이 기반)
        left = Math.max(
          5,
          Math.min(left, viewportWidth - getDropdownWidth() - 5)
        );

        // 화면 하단에 가까우면 위로 표시
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow < 150 && spaceAbove > 150) {
          top = rect.top;
          setIsUpward(true);
        } else {
          setIsUpward(false);
        }

        setDropdownPosition({
          top: Math.max(5, top),
          left: left,
        });
      }
    }, [isOpen]);

    // 외부 클릭 감지
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isTriggerClick = triggerRef.current?.contains(target);
        const isDropdownClick = dropdownRef.current?.contains(target);

        if (!isTriggerClick && !isDropdownClick) {
          setIsOpen(false);
        }
      };

      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    // ESC 키 감지
    React.useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    const handleTriggerClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleOptionClick = (optionValue: string | number) => {
      onChange?.(optionValue);
      setIsOpen(false);
    };

    // 값 비교 함수 (타입 변환 포함)
    const isValueEqual = (
      val1: string | number | undefined,
      val2: string | number
    ) => {
      if (val1 === undefined) return false;
      if (typeof val1 === "number" && typeof val2 === "string") {
        return Number(val2) === val1;
      } else if (typeof val1 === "string" && typeof val2 === "number") {
        return val2 === Number(val1);
      }
      return val1 === val2;
    };

    const selectedOption = options.find((option) =>
      isValueEqual(value, option.value)
    );

    // renderValue가 있으면 커스텀 렌더링, 없으면 기본 텍스트
    const displayContent = renderValue
      ? renderValue(value, selectedOption)
      : isAllShowPlaceholder && selectedOption?.label === "전체"
        ? placeholder
        : selectedOption?.label || placeholder;

    // 가장 긴 옵션 텍스트 길이 계산
    const maxOptionWidth = Math.max(
      ...options.map((option) => option.label.length),
      placeholder?.length || 0
    );

    const getDropdownWidth = () => {
      let letterWidth = 12;
      switch (size) {
        case "xs":
          letterWidth = 8;
          break;
        case "sm":
          letterWidth = 10;
          break;
        case "lg":
          letterWidth = 14;
          break;
      }

      let extraSpace = 35;
      switch (size) {
        case "xs":
          extraSpace = 25;
          break;
        case "sm":
          extraSpace = 30;
          break;
        case "lg":
          extraSpace = 40;
          break;
      }

      return Math.max(50, maxOptionWidth * letterWidth + extraSpace);
    };

    return (
      <div
        className={cn("relative inline-flex items-center", parentClassName)}
        ref={ref}
      >
        <div
          className={cn(
            INPUT_COMMON_CLASS,
            INPUT_FOCUS_CLASS,
            sizeClasses[size],
            isDisabled && "opacity-50 cursor-not-allowed",
            "cursor-pointer overflow-hidden text-ellipsis",
            className
          )}
          ref={triggerRef}
          onClick={handleTriggerClick}
          {...props}
        >
          <span className="flex-1 truncate min-w-0">{displayContent}</span>

          {loading ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <MyLoadingSpinner size={"fixed"} />
            </div>
          ) : (
            !hideChevron && (
              <ChevronDownIcon
                className={cn(
                  "absolute text-[var(--text-secondary)] pointer-events-none top-1/2 -translate-y-1/2",
                  sizeIconClasses[size]
                )}
              />
            )
          )}
        </div>

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              data-my-select-dropdown="true"
              className="fixed border shadow-lg rounded-sm my-scroll bg-[var(--card-bg)] border-[var(--card-border)]"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: `${getDropdownWidth()}px`,
                maxHeight: "200px",
                transform: isUpward ? "translateY(-100%)" : "translateY(0)",
                zIndex: 9999,
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    "w-full flex items-center text-left transition-colors",
                    sizeClasses[size],
                    "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-tertiary)]",
                    selectedOption &&
                      isValueEqual(value, option.value) &&
                      "bg-[var(--main-color)] text-white",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() =>
                    !option.disabled && handleOptionClick(option.value)
                  }
                  disabled={option.disabled}
                >
                  {option.label}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

MySelect.displayName = "MySelect";

export { MySelect };
