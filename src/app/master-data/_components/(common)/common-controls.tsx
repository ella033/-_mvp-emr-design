import MyInput from "@/components/yjg/my-input";
import { cn } from "@/lib/utils";
import { InfoIcon, Search } from "lucide-react";
import React from "react";
import { MyButton } from "@/components/yjg/my-button";
import { MyTooltip } from "@/components/yjg/my-tooltip";

export function BoxContainer({
  className,
  isWidthFull = false,
  isWidthFit = false,
  children,
}: {
  className?: string;
  isWidthFull?: boolean;
  isWidthFit?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap gap-4",
        isWidthFull && "w-full flex-1 min-w-fit",
        isWidthFit && "w-fit",
        className
      )}
    >
      {children && children}
    </div>
  );
}

export function Box({
  title,
  subTitle,
  className,
  childrenClassName,
  isRequired = false,
  isWidthFit = false,
  children,
  headerChildren,
}: {
  title?: string;
  subTitle?: string;
  className?: string;
  childrenClassName?: string;
  isRequired?: boolean;
  isWidthFit?: boolean;
  children: React.ReactNode;
  headerChildren?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        isWidthFit ? "w-fit" : "flex-1 w-full",
        className
      )}
    >
      {title && (
        <div className="flex flex-row gap-2 justify-between items-center">
          <div className="text-base text-gray-600 dark:text-gray-400 whitespace-nowrap flex flex-row items-center">
            {title}
            {isRequired && (
              <span className="text-base font-bold text-red-500">*</span>
            )}
            {subTitle && (
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap ml-1">
                {subTitle}
              </div>
            )}
          </div>

          <div className="flex flex-row gap-2">{headerChildren}</div>
        </div>
      )}
      <div className={cn("flex flex-row gap-2", childrenClassName)}>
        {children}
      </div>
    </div>
  );
}

export function InputWithButton({
  value,
  align = "left",
  isError = false,
  className,
  onChange,
  onClick,
  tooltipText,
  readonly = false,
}: {
  value?: string;
  align?: "left" | "center" | "right";
  isError?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;
  tooltipText?: string;
  readonly?: boolean;
}) {
  return (
    <MyTooltip side="bottom" align="start" content={tooltipText}>
      <div
        className={cn("flex flex-row gap-1 w-full", className)}
        onClick={onClick}
      >
        <MyInput
          value={value}
          onChange={onChange}
          type={readonly ? "readonly" : "text"}
          className={cn(
            "rounded-sm",
            align === "center" && "text-center",
            align === "right" && "text-right",
            isError && "border-red-500 text-red-500 animate-shake",
            readonly && "min-w-30"
          )}
        />
        <MyButton className="p-2">
          <Search className="w-3 h-3 text-white" />
        </MyButton>
      </div>
    </MyTooltip>
  );
}

export function DivideLine({ className }: { className?: string }) {
  return (
    <div className={cn("w-full py-3", className)}>
      <hr className="w-full border-gray-300 dark:border-gray-600" />
    </div>
  );
}

export function MasterDataContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-[var(--card)] py-0 pl-2 pr-0">
      {children}
    </div>
  );
}

export function GridContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col w-full h-full p-3 gap-3", className)}>
      {children}
    </div>
  );
}

export function MasterDataDetailContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full w-full bg-[var(--card)] py-3 pl-2 pr-3 gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MasterDataDetailContentContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 flex flex-col gap-3 px-[12px] py-[6px] border border-[var(--border-1)] rounded-sm mx-1 overflow-y-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MasterDataDetailEmpty({ message, className }: { message?: string, className?: string }) {
  return (
    <MasterDataDetailContentContainer className={className}>
      <div className="text-[12px] text-center text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">
        {message ||
          "리스트에서 선택하거나 비급여자료 생성을 클릭하여 입력해주세요."}
      </div>
    </MasterDataDetailContentContainer>
  );
}

export function SelectedBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-0 bottom-0 bg-blue-500/20 z-10 pointer-events-none",
        className
      )}
    />
  );
}

export function HighlightBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-0 bottom-0 bg-yellow-500/20 z-10 pointer-events-none",
        className
      )}
    />
  );
}

export function HighlightLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-0 bottom-0 border-2 border-blue-500 border-dashed z-10 pointer-events-none",
        className
      )}
    />
  );
}

export function MasterDataTitle({
  title,
  tooltipText,
}: {
  title?: string;
  tooltipText?: string;
}) {
  return (
    <div className="text-[14px] font-bold px-3 whitespace-nowrap flex flex-row items-center gap-1">
      {title}
      <MyTooltip content={tooltipText}>
        <InfoIcon className="size-4" />
      </MyTooltip>
    </div>
  );
}
