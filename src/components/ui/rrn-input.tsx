import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  formatRrnNumber,
  extractInfoFromRrn,
  isRrnBirthDateAfterTodayKst,
} from "@/lib/common-utils";

export interface RrnBirthInfo {
  /** YYYYMMDD 형태 */
  birthString: string;
  /** 1: 남성, 2: 여성, 0: 미상 */
  gender: number;
  /** 13자리 유효 여부 */
  isValid: boolean;
}

export interface RrnInputProps {
  /** raw digit 문자열 (하이픈 없음), e.g. "9301011234567" */
  value: string;
  /** 값 변경 시 raw digits 전달 */
  onRrnChange: (rawDigits: string) => void;
  /** 생년월일/성별 추출 콜백 (7자리 이상 입력 시 호출) */
  onBirthInfoExtracted?: (info: RrnBirthInfo) => void;
  /** blur 콜백 (부모에서 patientBaseInfo 업데이트/중복체크 처리) */
  onBlur?: (rawDigits: string) => void;
  /** Tab 키 콜백. true 반환 시 다음 포커스 허용, false 시 포커스 유지 */
  onTabKey?: (rawDigits: string) => Promise<boolean> | boolean;
  /** Enter 키 콜백. 13자리일 때만 호출됨 */
  onEnterKey?: (rawDigits: string) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 (자격조회 진행 중 등) */
  loading?: boolean;
  /** 외부 중복 상태 */
  isDuplicate?: boolean;
  /** 플레이스홀더 (기본: "- 없이 입력") */
  placeholder?: string;
  /** wrapper div 추가 클래스 */
  className?: string;
  /** input 요소 추가 클래스 */
  inputClassName?: string;
  /** input data-testid */
  testId?: string;
  /** 우측 슬롯 (자격조회 버튼 등) */
  renderSuffix?: React.ReactNode;
  /** dirty tracking 콜백 */
  onDirtyChange?: () => void;
}

const RrnInput = React.forwardRef<HTMLInputElement, RrnInputProps>(
  (
    {
      value,
      onRrnChange,
      onBirthInfoExtracted,
      onBlur,
      onTabKey,
      onEnterKey,
      disabled = false,
      loading = false,
      isDuplicate = false,
      placeholder = "- 없이 입력",
      className,
      inputClassName,
      testId,
      renderSuffix,
      onDirtyChange,
    },
    ref
  ) => {
    const [shake, setShake] = useState(false);
    const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    // Combined ref (forwardRef + internal ref)
    const handleRef = (el: HTMLInputElement | null) => {
      // @ts-ignore
      inputRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    };

    // 계산 값
    const isFutureDate = isRrnBirthDateAfterTodayKst(value);
    const formattedValue = formatRrnNumber(value);

    // shake 트리거 (500ms 후 자동 해제)
    const triggerShake = useCallback(() => {
      setShake(true);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = setTimeout(() => setShake(false), 500);
    }, []);

    // isDuplicate가 true로 변경될 때 shake 트리거
    const prevIsDuplicateRef = useRef(isDuplicate);
    useEffect(() => {
      if (isDuplicate && !prevIsDuplicateRef.current) {
        triggerShake();
      }
      prevIsDuplicateRef.current = isDuplicate;
    }, [isDuplicate, triggerShake]);

    // cleanup
    useEffect(() => {
      return () => {
        if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      };
    }, []);

    // 생년월일 추출 및 콜백 호출
    const notifyBirthInfo = useCallback(
      (digits: string) => {
        if (!onBirthInfoExtracted) return;
        const info = extractInfoFromRrn(digits);
        if (info.isValid) {
          onBirthInfoExtracted({
            birthString: info.birthString,
            gender: info.gender,
            isValid: true,
          });
        }
      },
      [onBirthInfoExtracted]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (document.activeElement !== e.target) return;

        const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
        const limitedNumbers = numbersOnly.slice(0, 13);

        // 8번째 자리부터 막기: 앞 7자리(생년월일+성별코드)가 미래면 입력 차단
        const prefix7 = limitedNumbers.slice(0, 7);
        const isFuturePrefix7 =
          limitedNumbers.length >= 7 &&
          isRrnBirthDateAfterTodayKst(prefix7);

        if (limitedNumbers.length > 7 && isFuturePrefix7) {
          triggerShake();
          onRrnChange(prefix7);
          notifyBirthInfo(prefix7);
          return;
        }

        onRrnChange(limitedNumbers);
        notifyBirthInfo(limitedNumbers);
        onDirtyChange?.();
      },
      [onRrnChange, notifyBirthInfo, onDirtyChange, triggerShake]
    );

    const handleBlur = useCallback(() => {
      onBlur?.(value);
    }, [onBlur, value]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Shift+Tab: 기본 동작 허용
        if (e.key === "Tab" && e.shiftKey) return;

        if (e.key === "Tab") {
          if (onTabKey) {
            e.preventDefault();
            void Promise.resolve(onTabKey(value));
          }
          return;
        }

        if (e.key === "Enter") {
          e.preventDefault();
          if (loading || disabled) return;

          // 13자리 완성일 때만 Enter 키 콜백 호출
          const digits = value.replace(/[^0-9]/g, "");
          if (digits.length !== 13) return;

          onEnterKey?.(digits);
        }
      },
      [value, loading, disabled, onTabKey, onEnterKey]
    );

    const hasError = isDuplicate || isFutureDate;

    return (
      <div className={cn("relative flex flex-col", className)}>
        <div className="relative">
          <input
            ref={handleRef}
            type="text"
            data-testid={testId}
            placeholder={placeholder}
            value={formattedValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={14}
            inputMode="numeric"
            pattern="[0-9\-]*"
            className={cn(
              "text-sm text-[var(--main-color)] rounded-md p-1 pl-2 transition-all duration-150 w-full",
              shake && "animate-shake",
              hasError
                ? "border-2 border-[var(--negative)]"
                : "border border-[var(--border-2)]",
              inputClassName
            )}
            disabled={disabled}
          />
          {renderSuffix}
        </div>
        {isFutureDate && (
          <div className="mt-1 text-xs text-[var(--negative)]">
            생년월일을 확인 하시기 바랍니다
          </div>
        )}
      </div>
    );
  }
);

RrnInput.displayName = "RrnInput";

export { RrnInput };
