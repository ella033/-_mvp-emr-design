import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface InputNumberProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onUpdate: (value: string) => void;
  onCancel?: () => void;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, onUpdate, onCancel, defaultValue, ...props }, ref) => {
    const [value, setValue] = useState(defaultValue ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = e.target.value.replace(/[^0-9]/g, "");
      setValue(sanitizedValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onUpdate(e.currentTarget.value);
      } else if (e.key === "Escape") {
        if (onCancel) {
          onCancel();
        }
      }
    };

    const handleRef = (el: HTMLInputElement | null) => {
      // @ts-ignore
      inputRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    };

    return (
      <input
        type="text"
        ref={handleRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={(e) => onUpdate(e.target.value)}
        className={cn("w-full text-center bg-transparent", className)}
        autoFocus
        {...props}
      />
    );
  }
);

InputNumber.displayName = "InputNumber";

export { InputNumber };
