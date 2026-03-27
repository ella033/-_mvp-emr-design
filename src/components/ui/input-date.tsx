import React from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "./input";

interface InputDateProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  error?: boolean;
  min?: string;
  max?: string;
  testId?: string;
}

const InputDate: React.FC<InputDateProps> = ({
  value = "",
  onChange,
  onBlur,
  placeholder = "YYYY-MM-DD",
  className = "",
  wrapperClassName = "",
  disabled = false,
  error = false,
  min,
  max,
  testId,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div className="relative">
        <Input
          data-testid={testId}
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          className={`pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${error ? "border-red-500 focus-visible:ring-red-500" : ""
            } ${className}`}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default InputDate;
