import React from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "./input";
import { MyButton } from "@/components/yjg/my-button";

interface InputDateRangeWithMonthProps {
  fromValue?: string;
  toValue?: string;
  onChange?: (value: { from: string; to: string }) => void;
  onBlur?: () => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  monthOptions?: number[];
  buttonClassName?: string;
}

const InputDateRangeWithMonth: React.FC<InputDateRangeWithMonthProps> = ({
  fromValue = "",
  toValue = "",
  onChange,
  onBlur,
  fromPlaceholder = "YYYY-MM-DD",
  toPlaceholder = "YYYY-MM-DD",
  className = "",
  disabled = false,
  error = false,
  monthOptions = [1, 3, 6],
  buttonClassName = "",
}) => {
  const handleMonthClick = (months: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(today.getMonth() - months);

    const fromDateStr = from.toISOString().split("T")[0] || "";
    const toDateStr = today.toISOString().split("T")[0] || "";

    onChange?.({ from: fromDateStr, to: toDateStr });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {/* From Date */}
        <div className="relative">
          <Input
            type="date"
            value={fromValue}
            onChange={(e) => onChange?.({ from: e.target.value, to: toValue })}
            onBlur={onBlur}
            placeholder={fromPlaceholder}
            disabled={disabled}
            className={`h-7 w-[110px] pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${error ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Separator */}
        <span className="text-sm text-[var(--gray-400)]">-</span>

        {/* To Date */}
        <div className="relative">
          <Input
            type="date"
            value={toValue}
            onChange={(e) => onChange?.({ from: fromValue, to: e.target.value })}
            onBlur={onBlur}
            placeholder={toPlaceholder}
            disabled={disabled}
            className={`h-7 w-[110px] pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${error ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      {monthOptions.map((months) => (
        <MyButton
          key={months}
          variant="outline"
          size="md"
          onClick={() => handleMonthClick(months)}
          className={buttonClassName}
        >
          {months}개월
        </MyButton>
      ))}
    </div>
  );
};

export default InputDateRangeWithMonth;

