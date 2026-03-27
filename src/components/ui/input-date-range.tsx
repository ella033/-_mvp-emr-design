import React from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "./input";

interface InputDateRangeProps {
  fromValue?: string;
  toValue?: string;
  onChange?: (value: { from: string; to: string }) => void;
  onBlur?: () => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const InputDateRange: React.FC<InputDateRangeProps> = ({
  fromValue = "",
  toValue = "",
  onChange,
  onBlur,
  fromPlaceholder = "YYYY-MM-DD",
  toPlaceholder = "YYYY-MM-DD",
  className = "",
  disabled = false,
  error = false,
}) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({ from: e.target.value, to: toValue });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({ from: fromValue, to: e.target.value });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* From Date */}
      <div className="relative flex-1">
        <Input
          type="date"
          value={fromValue}
          onChange={handleFromChange}
          onBlur={onBlur}
          placeholder={fromPlaceholder}
          disabled={disabled}
          className={`pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
            error ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Separator */}
      <span className="text-gray-500 text-sm">~</span>

      {/* To Date */}
      <div className="relative flex-1">
        <Input
          type="date"
          value={toValue}
          onChange={handleToChange}
          onBlur={onBlur}
          placeholder={toPlaceholder}
          disabled={disabled}
          className={`pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
            error ? "border-red-500 focus-visible:ring-red-500" : ""
          }`}
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default InputDateRange;
