import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface TimeOption {
  value: string;
  display: string;
}

interface ListTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  fromTime?: string;
  toTime?: string;
  timeDuration?: number;
  disabled?: boolean;
  dropdownPosition?: 'bottom' | 'top';
  customTimeOptions?: TimeOption[];
  use12HourFormat?: boolean;
  /**
   * 부모가 overflow(auto/hidden)인 컨테이너 안에서도 드롭다운이 잘리지 않도록
   * 드롭다운을 body에 포탈로 렌더링합니다.
   */
  usePortal?: boolean;
  portalZIndex?: number;
}

const ListTimePicker: React.FC<ListTimePickerProps> = ({
  value = '',
  onChange,
  className = '',
  placeholder = "시간 선택",
  fromTime = "00:00",
  toTime = "24:00",
  timeDuration = 30,
  disabled = false,
  dropdownPosition = 'bottom',
  customTimeOptions,
  use12HourFormat = true,
  usePortal = false,
  portalZIndex = 9999,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

  // 시간을 분으로 변환하는 함수
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours ?? 0) * 60 + (minutes ?? 0);
  };

  // 분을 시간으로 변환하는 함수
  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // 24시간 형식을 12시간 형식으로 변환
  const formatTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number) ?? [0, 0];
    const period = (hours ?? 0) >= 12 ? '오후' : '오전';
    const hours12 = (hours ?? 0) === 0 ? 12 : (hours ?? 0) > 12 ? (hours ?? 0) - 12 : (hours ?? 0);
    return `${period} ${hours12.toString().padStart(2, '0')}:${(minutes ?? 0).toString().padStart(2, '0')}`;
  };

  // 시간 형식 검증 (HH:MM)
  const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  // 입력값을 시간 형식으로 포맷팅
  const formatTimeInput = (input: string): string => {
    // 숫자만 추출
    const numbers = input.replace(/\D/g, '');

    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) {
      const hours = numbers.slice(0, 2);
      const minutes = numbers.slice(2);
      return `${hours}:${minutes}`;
    }

    // 4자리 이상인 경우 앞의 4자리만 사용
    const hours = numbers.slice(0, 2);
    const minutes = numbers.slice(2, 4);
    return `${hours}:${minutes}`;
  };

  // 12시간 형식을 24시간 형식으로 변환
  const convert12To24Hour = (time12: string, period: string): string => {
    const [hours, minutes] = time12.split(':').map(Number);
    const h = hours ?? 0;
    const m = minutes ?? 0;

    if (period === '오후') {
      if (h === 12) {
        return `12:${m.toString().padStart(2, '0')}`;
      } else {
        return `${h + 12}:${m.toString().padStart(2, '0')}`;
      }
    } else { // 오전
      if (h === 12) {
        return `00:${m.toString().padStart(2, '0')}`;
      } else {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }
  };

  // 시간 옵션 리스트 생성
  const generateTimeOptions = (): TimeOption[] => {
    // 커스텀 옵션이 제공된 경우 그것을 사용
    if (customTimeOptions && customTimeOptions.length > 0) {
      return customTimeOptions;
    }

    const startMinutes = timeToMinutes(fromTime);
    let endMinutes = timeToMinutes(toTime);

    // toTime이 24:00인 경우 처리
    if (toTime === "24:00") {
      endMinutes = 24 * 60;
    }

    const options: TimeOption[] = [];

    for (let minutes = startMinutes; minutes <= endMinutes; minutes += timeDuration) {
      const timeValue = minutesToTime(minutes);
      const displayValue = use12HourFormat ? formatTo12Hour(timeValue) : timeValue;
      options.push({
        value: timeValue,
        display: displayValue
      });
    }

    return options;
  };

  const timeOptions = generateTimeOptions();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // wrapper(트리거/인풋) 안 클릭은 유지
      if (wrapperRef.current && wrapperRef.current.contains(target)) return;
      // 포탈 드롭다운 안 클릭도 유지
      if (dropdownMenuRef.current && dropdownMenuRef.current.contains(target)) return;

      {
        setIsOpen(false);
        if (isEditing) {
          handleInputBlur();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  const canUseDOM = typeof document !== 'undefined';

  const updatePortalPosition = useCallback(() => {
    if (!usePortal) return;
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = 4; // mt-1 / mb-1 대응

    const top =
      dropdownPosition === 'top'
        ? Math.max(0, rect.top - gap)
        : rect.bottom + gap;

    setPortalStyle({
      position: 'fixed',
      left: rect.left,
      top,
      width: rect.width,
      zIndex: portalZIndex,
    });
  }, [dropdownPosition, portalZIndex, usePortal]);

  useEffect(() => {
    if (!usePortal || !isOpen) return;

    updatePortalPosition();

    const handleResize = () => updatePortalPosition();
    // 스크롤 컨테이너에서도 반응하도록 capture 단계 사용
    const handleScroll = () => updatePortalPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePortalPosition, usePortal]);

  const handleTimeSelect = (timeValue: string): void => {
    onChange?.(timeValue);
    setIsOpen(false);
    setIsEditing(false);
  };

  const handleToggle = (): void => {
    if (!disabled && !isEditing) {
      if (!isOpen) {
        // 포탈 드롭다운은 열기 전에 위치를 먼저 계산해 깜빡임을 최소화
        updatePortalPosition();
        setIsOpen(true);
        // 드롭다운이 열린 후 선택된 시간으로 스크롤
        setTimeout(() => {
          const root = (usePortal ? dropdownMenuRef.current : wrapperRef.current) as HTMLElement | null;
          if (value && root) {
            const dropdown = root.querySelector('.overflow-y-auto') as HTMLElement;
            if (dropdown) {
              const selectedOption = dropdown.querySelector(`[data-value="${value}"]`) as HTMLElement;
              if (selectedOption) {
                selectedOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }, 100);
      } else {
        setIsOpen(false);
      }
    }
  };

  const handleInputClick = (): void => {
    if (!disabled) {
      setIsEditing(true);
      // 12시간 형식일 때는 시간 부분만 추출하여 입력값으로 설정
      if (use12HourFormat && value) {
        const timePart = formatTo12Hour(value).split(' ')[1] || '';
        setInputValue(timePart);
      } else {
        setInputValue(value);
      }
      setIsOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatTimeInput(e.target.value);
    setInputValue(formatted || '');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleInputConfirm();
    } else if (e.key === 'Escape') {
      handleInputCancel();
    }
  };

  const handleInputConfirm = (): void => {
    if (isValidTimeFormat(inputValue)) {
      let finalValue = inputValue;

      // 12시간 형식일 때는 현재 오전/오후 정보를 유지하여 24시간 형식으로 변환
      if (use12HourFormat && value) {
        const currentPeriod = formatTo12Hour(value).split(' ')[0] || '오전';
        finalValue = convert12To24Hour(inputValue, currentPeriod);
      }

      onChange?.(finalValue);
    }
    setIsEditing(false);
    setInputValue('');
  };

  const handleInputCancel = (): void => {
    setIsEditing(false);
    setInputValue('');
  };

  const handleInputBlur = (): void => {
    // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록 함
    setTimeout(() => {
      if (isValidTimeFormat(inputValue)) {
        let finalValue = inputValue;

        // 12시간 형식일 때는 현재 오전/오후 정보를 유지하여 24시간 형식으로 변환
        if (use12HourFormat && value) {
          const currentPeriod = formatTo12Hour(value).split(' ')[0] || '오전';
          finalValue = convert12To24Hour(inputValue, currentPeriod);
        }

        onChange?.(finalValue);
      }
      setIsEditing(false);
      setInputValue('');
    }, 150);
  };

  // 선택된 값의 표시 형식
  const getDisplayValue = (): string => {
    if (!value) return '';
    return use12HourFormat ? formatTo12Hour(value) : value;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Input Display */}
      {isEditing ? (
        <div className={`
          border border-gray-300 rounded px-3 py-2 text-sm pr-2 gap-2 
          bg-white flex items-center justify-between
          focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
          ${className}
        `}>
          <div className="flex items-center flex-1">
            {use12HourFormat && (
              <span className="text-sm text-gray-600 mr-1">
                {value ? formatTo12Hour(value).split(' ')[0] : '오전'}
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              placeholder="HH:MM"
              className="outline-none bg-transparent text-sm w-16"
              disabled={disabled}
              maxLength={5}
            />
          </div>
          <ChevronDown
            size={16}
            className="text-gray-500"
          />
        </div>
      ) : (
        <div
          onClick={handleToggle}
          ref={triggerRef}
          className={`
            border border-gray-300 rounded px-3 py-2 text-sm pr-2 gap-2 
            bg-white cursor-pointer flex items-center justify-between
            hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
        >
          <span
            className={getDisplayValue() ? 'text-black' : 'text-gray-400'}
            onDoubleClick={handleInputClick}
            title="더블클릭하여 직접 입력"
          >
            {getDisplayValue() || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''
              }`}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        (usePortal && canUseDOM
          ? createPortal(
              <div
                ref={dropdownMenuRef}
                style={portalStyle}
                className={`bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto transform ${dropdownPosition === 'top' ? '-translate-y-full' : ''}`}
              >
                {timeOptions.length > 0 ? (
                  timeOptions.map((option) => (
                    <div
                      key={option.value}
                      data-value={option.value}
                      onClick={() => handleTimeSelect(option.value)}
                      className={`
                        px-3 py-2 text-sm cursor-pointer
                        ${value === option.value
                          ? 'bg-[var(--violet-1)] text-[var(--main-color)] hover:bg-[var(--violet-1)]'
                          : 'text-[var(--main-color)] hover:bg-[var(--violet-1)]'
                        }
                      `}
                    >
                      {option.display}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    선택 가능한 시간이 없습니다.
                  </div>
                )}
              </div>,
              document.body
            )
          : (
              <div className={`absolute left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}>
                {timeOptions.length > 0 ? (
                  timeOptions.map((option) => (
                    <div
                      key={option.value}
                      data-value={option.value}
                      onClick={() => handleTimeSelect(option.value)}
                      className={`
                        px-3 py-2 text-sm cursor-pointer
                        ${value === option.value
                          ? 'bg-[var(--violet-1)] text-[var(--main-color)] hover:bg-[var(--violet-1)]'
                          : 'text-[var(--main-color)] hover:bg-[var(--violet-1)]'
                        }
                      `}
                    >
                      {option.display}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    선택 가능한 시간이 없습니다.
                  </div>
                )}
              </div>
            ))
      )}
    </div>
  );
};

export default ListTimePicker;