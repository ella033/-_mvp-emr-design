import { cn } from "@/lib/utils";
import React from "react";

const commonClass =
  "w-4 h-4 bg-[var(--input-bg)] border-[var(--input-border)] rounded-full";

export default function MyRadio({
  label,
  children,
  className,
  name,
  value,
  checked,
  onChange,
  disabled,
  ...props
}: {
  label?: string;
  children?: React.ReactNode;
  className?: string;
  name?: string;
  value?: string | number;
  checked?: boolean;
  onChange?: (checked: boolean, value: string) => void;
  disabled?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked, e.target.value);
  };

  return (
    <label className="flex flex-row gap-1 items-center w-fit">
      <input
        type="radio"
        className={cn(commonClass, className)}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      {label && (
        <div
          className={`whitespace-nowrap text-[12px] text-[var(--foreground)] ${checked ? "font-bold" : "font-normal"}`}
        >
          {label}
        </div>
      )}
      {children && <div>{children}</div>}
    </label>
  );
}
