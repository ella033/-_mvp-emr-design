import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "./use-debounce";

export function useDebouncedInput<T>(
  initialValue: T,
  onUpdate: (value: T) => void,
  delay: number = 500
) {
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(localValue, delay);
  const isInitialMount = useRef(true);
  const lastInitialValue = useRef(initialValue);
  const onUpdateRef = useRef(onUpdate);

  // onUpdate 콜백을 ref에 저장
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // 초기값이 변경되면 로컬 값 업데이트
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (initialValue !== lastInitialValue.current) {
      setLocalValue(initialValue);
      lastInitialValue.current = initialValue;
    }
  }, [initialValue]);

  // 디바운스된 값이 변경되면 콜백 호출
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    if (debouncedValue !== lastInitialValue.current) {
      onUpdateRef.current(debouncedValue);
    }
  }, [debouncedValue]);

  const handleChange = useCallback((value: T) => {
    setLocalValue(value);
  }, []);

  return {
    value: localValue,
    onChange: handleChange,
  };
}
