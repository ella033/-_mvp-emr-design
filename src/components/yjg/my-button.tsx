import * as React from "react";
import { cn } from "@/lib/utils";
import { MyTooltip } from "./my-tooltip";

export interface MyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "gray"
  | "outline"
  | "ghost";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: React.ReactNode;
  tooltipDelayDuration?: number;
}

// 버튼 컴포넌트를 별도로 분리
const ButtonContent = React.forwardRef<HTMLButtonElement, MyButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

    const variantClasses = {
      default:
        "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] focus:ring-[var(--ring-color)]",
      success:
        "bg-[var(--btn-success-bg)] text-[var(--btn-success-text)] hover:bg-[var(--btn-success-hover)] focus:ring-[var(--ring-color)]",
      warning:
        "bg-[var(--btn-warning-bg)] text-[var(--btn-warning-text)] hover:bg-[var(--btn-warning-hover)] focus:ring-[var(--ring-color)]",
      danger:
        "bg-[var(--btn-danger-bg)] text-[var(--btn-danger-text)] hover:bg-[var(--btn-danger-hover)] focus:ring-[var(--ring-color)]",
      gray: "bg-[var(--btn-gray-bg)] text-[var(--btn-gray-text)] hover:bg-[var(--btn-gray-hover)] focus:ring-[var(--ring-color)]",
      outline:
        "bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] border border-[var(--btn-outline-border)] hover:bg-[var(--btn-outline-hover)] focus:ring-[var(--ring-color)]",
      ghost:
        "bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:bg-[var(--btn-ghost-hover)] focus:ring-[var(--ring-color)]",
    };

    const sizeClasses = {
      xs: "text-[8px] px-[4px] py-[1px]",
      sm: "text-[10px] px-[6px] py-[1px]",
      md: "text-[12px] px-[8px] py-[3px]",
      lg: "text-[14px] px-[10px] py-[4px]",
      icon: "p-[3px]",
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 -ml-1 w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

ButtonContent.displayName = "ButtonContent";

const MyButton = React.forwardRef<HTMLButtonElement, MyButtonProps>(
  ({ tooltip, tooltipDelayDuration = 0, disabled, loading, ...props }, ref) => {
    if (tooltip) {
      const isDisabled = disabled || loading;
      const button = <ButtonContent ref={ref} disabled={disabled} loading={loading} {...props} />;
      return (
        <MyTooltip
          delayDuration={tooltipDelayDuration}
          content={
            <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
              {tooltip}
            </div>
          }
        >
          {isDisabled ? (
            <span className="inline-flex cursor-not-allowed">{button}</span>
          ) : (
            button
          )}
        </MyTooltip>
      );
    }

    return <ButtonContent ref={ref} disabled={disabled} loading={loading} {...props} />;
  }
);

MyButton.displayName = "MyButton";

export { MyButton };
