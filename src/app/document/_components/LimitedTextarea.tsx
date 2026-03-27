'use client';

import { useRef, useCallback, useLayoutEffect } from 'react';

interface LimitedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  fontSize?: number;
  verticalCenter?: boolean;
  'data-field-key'?: string;
}

// textarea lineHeight (편집/조회 모드 공통)
const TEXTAREA_LINE_HEIGHT = 1.4;
// fontSize가 전달되지 않을 때 사용하는 기본 tolerance (하위 호환)
const DEFAULT_OVERFLOW_TOLERANCE_PX = 2;

/**
 * 보이는 영역까지만 입력을 허용하는 Textarea 컴포넌트
 * - 스크롤이 발생하면 입력을 제한 (출력 시 잘리는 것 방지)
 * - 붙여넣기 시에도 영역 초과 방지
 * - 한글 IME 입력 대응
 */
export function LimitedTextarea(props: LimitedTextareaProps) {
  const { value, onChange, className, placeholder, style, fontSize, verticalCenter, ...rest } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastValidValueRef = useRef(value);
  const isComposingRef = useRef(false); // IME 입력 중 여부
  const pendingValueRef = useRef<string | null>(null); // 검증 대기 중인 값

  // fontSize가 있으면 반 줄 높이를 tolerance로 사용, 없으면 기본 2px (하위 호환)
  const overflowTolerancePx = fontSize
    ? Math.round(fontSize * TEXTAREA_LINE_HEIGHT * 0.5)
    : DEFAULT_OVERFLOW_TOLERANCE_PX;

  // 영역 초과 여부 체크 (tolerance 적용)
  // verticalCenter가 활성화되면 이전 layout effect에서 적용한 동적 패딩이 남아 있으므로,
  // overflow 측정 시 기본 패딩(2px)으로 임시 복원하여 정확하게 판정
  const isOverflowing = useCallback((textarea: HTMLTextAreaElement): boolean => {
    if (verticalCenter) {
      const prevPT = textarea.style.paddingTop;
      const prevPB = textarea.style.paddingBottom;
      textarea.style.paddingTop = '2px';
      textarea.style.paddingBottom = '2px';
      const overflows = textarea.scrollHeight > textarea.clientHeight + overflowTolerancePx;
      textarea.style.paddingTop = prevPT;
      textarea.style.paddingBottom = prevPB;
      return overflows;
    }
    return textarea.scrollHeight > textarea.clientHeight + overflowTolerancePx;
  }, [overflowTolerancePx, verticalCenter]);

  // 값 변경 처리 (onChange를 통해 React 상태 업데이트)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // IME 조합 중이면 일단 값을 그대로 전달 (compositionEnd에서 검증)
      if (isComposingRef.current) {
        onChange(e.target.value);
        return;
      }

      const newValue = e.target.value;
      pendingValueRef.current = newValue;
      onChange(newValue);
    },
    [onChange]
  );

  // 렌더링 후 오버플로우 체크 및 롤백
  useLayoutEffect(
    function checkOverflowAfterRender() {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (isComposingRef.current) return; // IME 조합 중에는 체크하지 않음

      const isInternalUpdate = pendingValueRef.current !== null;
      const hasValueChanged = value !== lastValidValueRef.current;
      const isExternalUpdate = !isInternalUpdate && hasValueChanged;

      // 변경 사항이 없으면 무시
      if (!isInternalUpdate && !isExternalUpdate) {
        return;
      }

      if (isOverflowing(textarea)) {
        // 오버플로우 발생 시 처리

        // 기존에도 오버플로우 상태였는데 글자수가 줄어든 경우라면 허용 (삭제/수정 대응)
        // 단, lastValidValueRef는 업데이트하지 않음 (여전히 오버플로우 상태이므로)
        // 이렇게 해야 나중에 텍스트를 추가할 때 마지막으로 유효했던 값으로 롤백할 수 있음
        const isReducingText = value.length < lastValidValueRef.current.length;
        if (isReducingText) {
          pendingValueRef.current = null;
          return;
        }

        if (isExternalUpdate && value.startsWith(lastValidValueRef.current)) {
          // 외부 업데이트(버튼 클릭 등)이면서 기존 값 뒤에 추가된 경우라면 가능한 만큼만 수용
          const addedText = value.slice(lastValidValueRef.current.length);
          const originalValue = textarea.value;

          let acceptedText = '';
          for (const char of addedText) {
            const testValue = lastValidValueRef.current + acceptedText + char;
            textarea.value = testValue;
            if (isOverflowing(textarea)) break;
            acceptedText += char;
          }

          textarea.value = originalValue; // React 관리를 위해 복원
          const finalValue = lastValidValueRef.current + acceptedText;

          pendingValueRef.current = null;
          if (finalValue !== value) {
            onChange(finalValue);
          } else {
            lastValidValueRef.current = finalValue;
          }
        } else {
          // 그 외의 경우(내부 입력 또는 전체 교체 등)는 마지막 유효 값으로 롤백
          pendingValueRef.current = null;
          onChange(lastValidValueRef.current);
        }
      } else {
        // 유효한 값으로 업데이트
        lastValidValueRef.current = value;
        pendingValueRef.current = null;
      }
    },
    [value, onChange, isOverflowing]
  );

  // 수직 중앙 정렬: DOM에 직접 패딩을 적용하여 re-render 없이 즉시 반영.
  // useState를 사용하면 값 변경 → overflow 롤백 → 패딩 재계산 사이에
  // 추가 렌더 사이클이 생겨 텍스트가 순간적으로 넘치는 깜빡임이 발생한다.
  // useLayoutEffect에서 DOM을 직접 수정하면 브라우저 페인트 전에 완료되어 깜빡임이 없다.
  useLayoutEffect(
    function applyVerticalCenterPadding() {
      // verticalCenter가 아닌 경우 DOM을 건드리지 않음 (React style prop 유지)
      if (!verticalCenter) return;

      const textarea = textareaRef.current;
      if (!textarea) return;

      // 높이를 0으로, 패딩을 0으로 설정하여 순수 콘텐츠 높이 측정
      // (scrollHeight는 clientHeight보다 작아질 수 없으므로 높이를 0으로 해야 정확)
      const prevHeight = textarea.style.height;
      textarea.style.height = '0px';
      textarea.style.paddingTop = '0px';
      textarea.style.paddingBottom = '0px';
      const contentHeight = textarea.scrollHeight;

      // 높이를 복원하고 (패딩은 0인 채로) 사용 가능한 전체 높이 측정
      textarea.style.height = prevHeight;
      const availableHeight = textarea.clientHeight;

      const padding = Math.max(0, Math.floor((availableHeight - contentHeight) / 2));
      if (padding > 0) {
        textarea.style.paddingTop = `${padding}px`;
        textarea.style.paddingBottom = '0px';
      } else {
        // 패딩 불필요 — React style prop의 기본 패딩 복원
        textarea.style.paddingTop = '';
        textarea.style.paddingBottom = '';
      }

      // cleanup: verticalCenter가 해제되거나 컴포넌트 언마운트 시 패딩 복원
      return () => {
        textarea.style.paddingTop = '';
        textarea.style.paddingBottom = '';
      };
    },
    [verticalCenter, value]
  );

  // IME 입력 시작 (한글 조합 시작)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  // IME 입력 완료 (한글 조합 완료)
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;

      const textarea = e.currentTarget;

      if (isOverflowing(textarea)) {
        // 오버플로우 발생 시 마지막 유효 값으로 롤백
        onChange(lastValidValueRef.current);
      } else {
        // 유효한 값으로 업데이트
        lastValidValueRef.current = textarea.value;
      }
    },
    [onChange, isOverflowing]
  );

  // 붙여넣기 처리
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();

      const textarea = e.currentTarget;
      const pastedText = e.clipboardData.getData('text');

      // 현재 선택 영역 고려하여 새 값 계산
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;

      // 전체 붙여넣기 시도
      const fullNewValue = currentValue.slice(0, start) + pastedText + currentValue.slice(end);

      // 측정을 위해 임시로 값 설정
      const originalValue = textarea.value;
      textarea.value = fullNewValue;

      if (!isOverflowing(textarea)) {
        // 전체가 들어가면 그대로 적용
        textarea.value = originalValue; // React가 관리하도록 복원
        lastValidValueRef.current = fullNewValue;
        onChange(fullNewValue);

        // 다음 렌더링 후 커서 위치 조정
        requestAnimationFrame(() => {
          const newCursorPos = start + pastedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
      } else {
        // 오버플로우 시 한 글자씩 추가하면서 최대치 찾기
        let acceptedText = '';
        for (const char of pastedText) {
          const testValue =
            currentValue.slice(0, start) + acceptedText + char + currentValue.slice(end);
          textarea.value = testValue;

          if (isOverflowing(textarea)) {
            break;
          }
          acceptedText += char;
        }

        textarea.value = originalValue; // React가 관리하도록 복원

        const finalValue = currentValue.slice(0, start) + acceptedText + currentValue.slice(end);
        lastValidValueRef.current = finalValue;
        onChange(finalValue);

        // 다음 렌더링 후 커서 위치 조정
        requestAnimationFrame(() => {
          const newCursorPos = start + acceptedText.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
      }
    },
    [onChange, isOverflowing]
  );

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onPaste={handlePaste}
      className={className}
      placeholder={placeholder}
      style={{
        ...style,
        resize: 'none',
        overflow: 'hidden', // 스크롤바 숨김
      }}
      {...rest}
    />
  );
}
