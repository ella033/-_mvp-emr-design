import { cn } from "@/lib/utils";
import React, { useState, useEffect, forwardRef } from "react";
import { DecimalPoint } from "@/constants/master-data-enum";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
  INPUT_SIZE_CLASS,
} from "./common/constant/class-constants";

const COMMON_CLASS = "w-full overflow-hidden text-ellipsis";

export interface ReferenceValue {
  normalMin?: number;
  normalMax?: number;
}

const MyInput = forwardRef<
  HTMLInputElement,
  {
    type: "text" | "text-number" | "date" | "time" | "dateTime" | "readonly";
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
    maxLength?: number;
    min?: number;
    max?: number;
    referenceValue?: ReferenceValue;
    pointPos?: number;
    pointType?: DecimalPoint;
    unit?: string;
    showComma?: boolean;
    value?: string | number;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
    isSelectAllOnFocus?: boolean;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      type,
      size = "md",
      className,
      maxLength,
      min,
      max,
      referenceValue,
      pointPos,
      pointType,
      unit,
      showComma = false,
      value,
      onChange,
      onBlur,
      readOnly = false,
      isSelectAllOnFocus = true,
      ...props
    },
    ref
  ) => {
    const sizeClass = INPUT_SIZE_CLASS[size as keyof typeof INPUT_SIZE_CLASS];

    const unitSize = {
      xs: "text-[6px]",
      sm: "text-[8px]",
      md: "text-[10px]",
      lg: "text-[12px]",
    };
    const unitSizeClass = unitSize[size as keyof typeof unitSize];

    switch (type) {
      case "text":
        return (
          <TextInput
            ref={ref}
            sizeClass={sizeClass}
            className={className}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            isSelectAllOnFocus={isSelectAllOnFocus}
            {...props}
          />
        );
      case "text-number":
        return (
          <TextNumberInput
            ref={ref}
            sizeClass={sizeClass}
            unitSizeClass={unitSizeClass}
            className={className}
            min={min}
            max={max}
            pointPos={pointPos}
            pointType={pointType}
            unit={unit}
            showComma={showComma}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            referenceValue={referenceValue}
            {...props}
          />
        );
      case "date":
        return (
          <DateInput
            ref={ref}
            sizeClass={sizeClass}
            className={className}
            value={String(value)}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            {...props}
          />
        );
      case "time":
        return (
          <TimeInput
            ref={ref}
            sizeClass={sizeClass}
            className={className}
            value={String(value)}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            {...props}
          />
        );
      case "dateTime":
        return (
          <DateTimeInput
            ref={ref}
            sizeClass={sizeClass}
            className={className}
            value={String(value)}
            onChange={onChange}
            onBlur={onBlur}
            readOnly={readOnly}
            {...props}
          />
        );
      case "readonly":
        return (
          <ReadonlyInput
            sizeClass={sizeClass}
            className={className}
            value={value}
            readOnly={readOnly}
            {...props}
          />
        );
      default:
        return null;
    }
  }
);

MyInput.displayName = "MyInput";

export default MyInput;

function ReadonlyInput({
  sizeClass,
  className,
  value,
  ...props
}: {
  sizeClass?: string;
  className?: string;
  value?: string | number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <div
      className={cn(
        COMMON_CLASS,
        INPUT_COMMON_CLASS,
        "bg-[var(--readonly-bg)] text-[var(--readonly-text)] w-fit",
        sizeClass,
        className
      )}
      {...props}
    >
      {value}
    </div>
  );
}

const TextInput = forwardRef<
  HTMLInputElement,
  {
    sizeClass?: string;
    className?: string;
    maxLength?: number;
    value?: string | number;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
    isSelectAllOnFocus?: boolean;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      sizeClass,
      className,
      maxLength,
      value,
      onChange,
      onBlur,
      readOnly = false,
      isSelectAllOnFocus = true,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(String(value || ""));

    // 외부 value가 변경되면 내부 상태도 업데이트
    useEffect(() => {
      setInternalValue(String(value || ""));
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Enter 키 처리
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.blur(); // 포커스를 잃게 하여 onBlur 이벤트 발생
        return;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      // maxLength를 초과하면 잘라내기
      if (maxLength !== undefined && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e.target.value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (readOnly) return;
      if (isSelectAllOnFocus) {
        e.target.select();
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        className={cn(
          COMMON_CLASS,
          INPUT_COMMON_CLASS,
          INPUT_FOCUS_CLASS,
          sizeClass,
          className
        )}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

TextInput.displayName = "TextInput";

const TextNumberInput = forwardRef<
  HTMLInputElement,
  {
    sizeClass?: string;
    unitSizeClass?: string;
    className?: string;
    min?: number;
    max?: number;
    pointPos?: number;
    pointType?: DecimalPoint;
    unit?: string;
    showComma?: boolean;
    value?: string | number;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
    referenceValue?: ReferenceValue;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      sizeClass,
      unitSizeClass,
      className,
      min,
      max,
      pointPos,
      pointType,
      unit,
      showComma = false,
      value,
      onChange,
      onBlur,
      readOnly = false,
      referenceValue,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(String(value || ""));
    const [displayValue, setDisplayValue] = useState("");
    const [isBlinking, setIsBlinking] = useState(false);
    // 정상 범위 상태: "normal" | "above" (초과) | "below" (미만)
    const [rangeStatus, setRangeStatus] = useState<"normal" | "above" | "below">("normal");

    // 숫자에 천단위 구분자 추가
    const addCommas = (numStr: string) => {
      if (!showComma || !numStr || numStr === "" || numStr === "-")
        return numStr;

      const parts = numStr.split(".");
      const integerPart = parts[0]?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "";
      return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    };

    // 천단위 구분자와 단위 제거하여 순수 숫자만 반환
    // 0으로 시작하는 정수 부분의 앞 0을 제거 (단, 소수점이 있으면 0.xxx 형태는 유지)
    const removeFormatting = (formattedStr: string) => {
      // 쉼표와 단위 제거
      let cleaned = formattedStr.replace(/,/g, "").replace(unit || "", "");

      // 음수 부호 처리
      const isNegative = cleaned.startsWith("-");
      if (isNegative) {
        cleaned = cleaned.substring(1);
      }

      // 소수점이 있는 경우
      if (cleaned.includes(".")) {
        const parts = cleaned.split(".");
        const integerPart = parts[0] || "";
        const decimalPart = parts[1] || "";
        // 정수 부분의 앞 0 제거 (단, "0"은 유지)
        const normalizedInteger = integerPart.replace(/^0+/, "") || "0";
        cleaned = `${normalizedInteger}.${decimalPart}`;
      } else {
        // 소수점이 없는 경우: 앞의 0들을 제거 (단, "0" 자체는 유지)
        cleaned = cleaned.replace(/^0+/, "");
      }

      // 음수 부호 복원
      if (isNegative) {
        cleaned = `-${cleaned}`;
      }

      return cleaned;
    };

    // 정상범위 체크 함수
    const checkNormalRange = (numValue: number) => {
      if (!referenceValue || numValue === 0) {
        setRangeStatus("normal");
        return;
      }

      const { normalMin, normalMax } = referenceValue;
      if (normalMin !== undefined && normalMax !== undefined) {
        if (numValue > normalMax) {
          setRangeStatus("above"); // 정상 범위 초과 -> 빨간색
        } else if (numValue < normalMin) {
          setRangeStatus("below"); // 정상 범위 미만 -> 파란색
        } else {
          setRangeStatus("normal");
        }
      } else if (normalMax !== undefined && numValue > normalMax) {
        setRangeStatus("above");
      } else if (normalMin !== undefined && numValue < normalMin) {
        setRangeStatus("below");
      } else {
        setRangeStatus("normal");
      }
    };

    // 외부 value가 변경되면 내부 상태도 업데이트
    // referenceValue는 의존성에서 제외 (부모가 매 렌더 새 객체를 넘기면 입력 중인 값이 덮어씌워지는 문제 방지)
    useEffect(() => {
      const cleanValue = String(value || "");
      setInternalValue(cleanValue);
      const formatted = addCommas(cleanValue);
      setDisplayValue(formatted);

      const numValue = Number(cleanValue);
      if (!isNaN(numValue)) {
        checkNormalRange(numValue);
      } else {
        setRangeStatus("normal");
      }
    }, [value, showComma, unit]);

    // referenceValue(정상범위) 변경 시에만 범위 상태 갱신 (internalValue는 입력 중 범위 색상 반영용)
    const normalMin = referenceValue?.normalMin;
    const normalMax = referenceValue?.normalMax;
    useEffect(() => {
      const numValue = Number(internalValue);
      if (!isNaN(numValue) && numValue !== 0) {
        checkNormalRange(numValue);
      } else {
        setRangeStatus("normal");
      }
    }, [normalMin, normalMax, internalValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const currentValue = input.value;

      // Enter 키 처리
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
        return;
      }

      // 허용된 키들 (쉼표는 제외)
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        ".",
        "-",
      ];

      if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }

      // 숫자, 소수점, 음수 부호만 입력 가능하도록 제한
      if (
        !/^[0-9.-]$/.test(e.key) &&
        !allowedKeys.slice(0, 8).includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // 소수점과 음수 부호는 한 번만 입력 가능
      if (e.key === "." && currentValue.includes(".")) {
        e.preventDefault();
        return;
      }
      if (e.key === "." && pointPos === 0) {
        e.preventDefault();
        return;
      }
      if (e.key === "-" && currentValue.includes("-")) {
        e.preventDefault();
        return;
      }
      if (e.key === "-" && min === 0) {
        e.preventDefault();
        return;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // 단위와 쉼표 제거
      const cleanValue = removeFormatting(inputValue);

      // 숫자, 소수점, 음수 부호만 허용하는 정규식으로 필터링
      let filteredValue = cleanValue.replace(/[^0-9.-]/g, "");

      // pointPos가 0이면 소수점 제거
      if (pointPos === 0) {
        filteredValue = filteredValue.replace(/\./g, "");
      }

      // 소수점이 여러 개인 경우 첫 번째만 유지
      const parts = filteredValue.split(".");
      const processedValue =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : filteredValue;

      // 음수 부호가 여러 개인 경우 첫 번째만 유지
      const finalValue = processedValue.replace(/-/g, (_match, index) => {
        return index === 0 ? "-" : "";
      });

      // 음수 부호가 맨 앞에 있지 않으면 제거
      let cleanValue2 = finalValue.startsWith("-")
        ? finalValue
        : finalValue.replace(/-/g, "");

      // min이 0이면 음수 부호 제거
      if (min === 0) {
        cleanValue2 = cleanValue2.replace(/-/g, "");
      }

      // pointPos가 설정된 경우 소수점 자리수 제한 및 반올림 처리
      let processedCleanValue = cleanValue2;
      if (pointPos !== undefined && cleanValue2.includes(".")) {
        const [integerPart, decimalPart] = cleanValue2.split(".");

        if (decimalPart && decimalPart.length > pointPos) {
          if (pointType !== undefined) {
            let roundedValue: number;
            const fullNumber = Number(cleanValue2);

            switch (pointType) {
              case DecimalPoint.RoundUp: // 올림
                roundedValue =
                  Math.ceil(fullNumber * Math.pow(10, pointPos)) /
                  Math.pow(10, pointPos);
                break;
              case DecimalPoint.RoundDown: // 반올림
                roundedValue =
                  Math.round(fullNumber * Math.pow(10, pointPos)) /
                  Math.pow(10, pointPos);
                break;
              case DecimalPoint.RoundHalf: // 0.5단위 처리
                roundedValue = Math.round(fullNumber * 2) / 2;
                break;
              case DecimalPoint.RoundHalfUp: // 0.5단위 올림
                roundedValue = Math.ceil(fullNumber * 2) / 2;
                break;
              default: // 그대로 (내림)
                roundedValue =
                  Math.floor(fullNumber * Math.pow(10, pointPos)) /
                  Math.pow(10, pointPos);
                break;
            }

            processedCleanValue = roundedValue.toString();
          } else {
            processedCleanValue =
              integerPart + "." + decimalPart.substring(0, pointPos);
          }
        }
      }

      // min/max 제한 체크
      if (
        processedCleanValue !== "" &&
        processedCleanValue !== "-" &&
        processedCleanValue !== "." &&
        processedCleanValue !== "-."
      ) {
        const numValue = Number(processedCleanValue);

        if (!isNaN(numValue)) {
          if (max !== undefined && numValue > max) {
            return;
          }
        }
      }

      // 내부 상태 업데이트 (순수 숫자)
      setInternalValue(processedCleanValue);

      // 화면 표시용 상태 업데이트 (포맷팅 적용)
      const formattedValue = addCommas(processedCleanValue);
      setDisplayValue(formattedValue);

      onChange?.(processedCleanValue);
    };

    const handleBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
      // 빈 값이면 빈 문자열 그대로 전달
      if (internalValue === "" || internalValue === "-") {
        setRangeStatus("normal");
        onBlur?.("");
        return;
      }

      let checkedValue = Number(internalValue);
      let valueChanged = false;

      if (!isNaN(checkedValue)) {
        if (min !== undefined && checkedValue < min) {
          checkedValue = min;
          const formattedMin = addCommas(min.toString());
          setDisplayValue(formattedMin);
          setInternalValue(min.toString());
          valueChanged = true;
        }
        if (max !== undefined && checkedValue > max) {
          checkedValue = max;
          const formattedMax = addCommas(max.toString());
          setDisplayValue(formattedMax);
          setInternalValue(max.toString());
          valueChanged = true;
        }

        // 정상범위 체크
        checkNormalRange(checkedValue);
      } else {
        setRangeStatus("normal");
      }

      // 값이 조정되었으면 blink 효과 표시
      if (valueChanged) {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
        }, 600); // 0.6초 동안 blink 효과
      }

      onBlur?.(checkedValue.toString());
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // 포커스 시에는 포맷팅된 값으로 선택
      e.target.select();
    };

    if (unit) {
      return (
        <div
          className={cn(
            COMMON_CLASS,
            INPUT_FOCUS_CLASS,
            "flex relative items-center w-full focus-within:bg-[var(--input-bg)]"
          )}
          tabIndex={-1}
        >
          <input
            ref={ref}
            type="text"
            className={cn(
              "flex-1 border-0 min-w-0 outline-none bg-transparent",
              COMMON_CLASS,
              sizeClass,
              className,
              isBlinking && "text-red-500 animate-flash",
              !isBlinking && rangeStatus === "above" && "font-bold text-red-600",
              !isBlinking && rangeStatus === "below" && "font-bold text-blue-600"
            )}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            {...props}
          />
          <span
            className={cn(
              unitSizeClass,
              "text-gray-500 flex flex-shrink-0 items-center pointer-events-none px-1"
            )}
          >
            {unit}
          </span>
        </div>
      );
    } else {
      return (
        <input
          ref={ref}
          type="text"
          className={cn(
            COMMON_CLASS,
            INPUT_COMMON_CLASS,
            INPUT_FOCUS_CLASS,
            sizeClass,
            className,
            isBlinking && "text-red-500 animate-flash",
            !isBlinking && rangeStatus === "above" && "font-bold text-red-600",
            !isBlinking && rangeStatus === "below" && "font-bold text-blue-600"
          )}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          {...props}
        />
      );
    }
  }
);

TextNumberInput.displayName = "TextNumberInput";

const DateInput = forwardRef<
  HTMLInputElement,
  {
    sizeClass?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      sizeClass,
      className,
      value,
      onChange,
      onBlur,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(
          "w-fit",
          INPUT_COMMON_CLASS,
          INPUT_FOCUS_CLASS,
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClass,
          className
        )}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={(e) => onBlur?.(e.target.value)}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

DateInput.displayName = "DateInput";

const TimeInput = forwardRef<
  HTMLInputElement,
  {
    sizeClass?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      sizeClass,
      className,
      value,
      onChange,
      onBlur,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    // ISO 형식의 시간 문자열을 time 형식으로 변환
    const convertToTimeLocal = (isoString: string): string => {
      if (!isoString) return "";

      // ISO 형식: "2024-01-01T12:30:00.000Z" 또는 "12:30:00" 또는 "12:30"
      // time 형식: "12:30"
      try {
        // 시간만 있는 경우 (HH:mm 또는 HH:mm:ss)
        if (isoString.includes("T")) {
          const date = new Date(isoString);
          if (isNaN(date.getTime())) return "";
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        } else {
          // 이미 시간 형식인 경우
          const timeMatch = isoString.match(/^(\d{1,2}):(\d{1,2})/);
          if (timeMatch && timeMatch[1] && timeMatch[2]) {
            const hours = String(parseInt(timeMatch[1], 10)).padStart(2, "0");
            const minutes = String(parseInt(timeMatch[2], 10)).padStart(2, "0");
            return `${hours}:${minutes}`;
          }
        }
      } catch {
        return "";
      }
      return "";
    };

    // time 형식을 ISO 형식으로 변환 (HH:mm 형식으로 반환)
    const convertToISO = (timeLocal: string): string => {
      if (!timeLocal) return "";

      // time 형식: "12:30"
      const timeMatch = timeLocal.match(/^(\d{1,2}):(\d{1,2})/);
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const hours = String(parseInt(timeMatch[1], 10)).padStart(2, "0");
        const minutes = String(parseInt(timeMatch[2], 10)).padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return "";
    };

    const [localValue, setLocalValue] = useState<string>(() =>
      convertToTimeLocal(String(value || ""))
    );

    // 외부 value가 변경되면 내부 상태도 업데이트
    useEffect(() => {
      setLocalValue(convertToTimeLocal(String(value || "")));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // ISO 형식으로 변환하여 onChange 호출
      const isoValue = convertToISO(newValue);
      onChange?.(isoValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const isoValue = convertToISO(e.target.value);
      onBlur?.(isoValue);
    };

    return (
      <input
        ref={ref}
        type="time"
        className={cn(
          "w-fit",
          INPUT_COMMON_CLASS,
          INPUT_FOCUS_CLASS,
          sizeClass,
          className
        )}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

TimeInput.displayName = "TimeInput";

const DateTimeInput = forwardRef<
  HTMLInputElement,
  {
    sizeClass?: string;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: (value: string) => void;
    readOnly?: boolean;
  } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">
>(
  (
    {
      sizeClass,
      className,
      value,
      onChange,
      onBlur,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    // ISO 형식의 날짜 문자열을 datetime-local 형식으로 변환
    const convertToDateTimeLocal = (isoString: string): string => {
      if (!isoString) return "";

      // ISO 형식: "2024-01-01T12:30:00.000Z" 또는 "2024-01-01T12:30:00"
      // datetime-local 형식: "2024-01-01T12:30"
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // datetime-local 형식을 ISO 형식으로 변환
    const convertToISO = (dateTimeLocal: string): string => {
      if (!dateTimeLocal) return "";

      // datetime-local 형식: "2024-01-01T12:30"
      const date = new Date(dateTimeLocal);
      if (isNaN(date.getTime())) return "";

      return date.toISOString();
    };

    const [localValue, setLocalValue] = useState<string>(() =>
      convertToDateTimeLocal(String(value || ""))
    );

    // 외부 value가 변경되면 내부 상태도 업데이트
    useEffect(() => {
      setLocalValue(convertToDateTimeLocal(String(value || "")));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // ISO 형식으로 변환하여 onChange 호출
      const isoValue = convertToISO(newValue);
      onChange?.(isoValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const isoValue = convertToISO(e.target.value);
      onBlur?.(isoValue);
    };

    return (
      <input
        ref={ref}
        type="datetime-local"
        className={cn(
          INPUT_COMMON_CLASS,
          INPUT_FOCUS_CLASS,
          sizeClass,
          className
        )}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readOnly}
        {...props}
      />
    );
  }
);

DateTimeInput.displayName = "DateTimeInput";
