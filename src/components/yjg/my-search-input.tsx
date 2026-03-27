import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import "@/components/yjg/common/style/my-style.css";
import { cn } from "@/lib/utils";
import {
  INPUT_COMMON_CLASS,
  INPUT_SIZE_CLASS,
  SEARCH_INPUT_CLASS,
  INPUT_FOCUS_CLASS,
} from "./common/constant/class-constants";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
  inputTestId?: string;
  className?: string;
  inputClassName?: string;
  inputSize?: "xs" | "sm" | "md" | "lg";
  hideMagnifyingGlass?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  maxLength?: number;
}

export default function MySearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  inputTestId,
  className,
  inputClassName,
  inputSize = "md",
  hideMagnifyingGlass = false,
  onKeyDown,
  autoFocus = false,
  maxLength,
}: SearchInputProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // maxLength를 초과하면 e.target.value 자체를 잘라내기
    if (maxLength !== undefined && e.target.value.length > maxLength) {
      e.target.value = e.target.value.slice(0, maxLength);
    }
    onChange?.(e);
  };

  return (
    <div
      className={cn(
        INPUT_COMMON_CLASS,
        INPUT_FOCUS_CLASS,
        "flex flex-row relative items-center w-full",
        className
      )}
    >
      {!hideMagnifyingGlass && (
        <div className="pl-[8px] flex-shrink-0">
          <MagnifyingGlassIcon className="w-[14px] h-[14px] text-[var(--input-border)]" />
        </div>
      )}
      <input
        type="text"
        data-testid={inputTestId}
        placeholder={placeholder || "검색"}
        className={cn(SEARCH_INPUT_CLASS, INPUT_SIZE_CLASS[inputSize], inputClassName)}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
      {value && (
        <div className="flex items-center px-[5px]">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onClear}
            aria-label="검색 지우기"
          >
            <XMarkIcon className="w-[14px] h-[14px]" />
          </button>
        </div>
      )}
    </div>
  );
}
