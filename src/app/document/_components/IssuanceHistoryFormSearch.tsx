'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchForms } from '@/hooks/forms/use-search-forms';

export type IssuanceHistoryFormSearchValue = {
  id: number;
  name: string;
};

export function IssuanceHistoryFormSearch({
  value,
  onChange,
  disabled,
  onDisabledClick,
}: {
  value: IssuanceHistoryFormSearchValue | null;
  onChange: (value: IssuanceHistoryFormSearchValue | null) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const debouncedQuery = useDebounce(query, 250);
  const { data } = useSearchForms(debouncedQuery);

  const forms = data?.forms ?? [];
  const hasQuery = Boolean(debouncedQuery.trim());
  const isDropdownOpen = isFocused && hasQuery;

  useEffect(function syncQueryFromSelectedValue() {
    if (value) {
      setQuery(value.name);
      return;
    }
    setQuery('');
  }, [value]);

  useEffect(function updateDropdownPositionWhenFocused() {
    if (!isFocused) return;

    function updateDropdownPosition() {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    updateDropdownPosition();
    const timer = setTimeout(updateDropdownPosition, 200);
    return () => clearTimeout(timer);
  }, [isFocused]);

  const highlightedForms = useMemo(() => {
    const keyword = debouncedQuery.trim();
    if (!keyword) return forms;
    return forms;
  }, [debouncedQuery, forms]);

  function handleChange(next: string) {
    const isOverwritingSelectedValue = Boolean(value) && next !== value?.name;
    if (isOverwritingSelectedValue) {
      onChange(null);
    }
    setQuery(next);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }

  function handleSelectForm(form: IssuanceHistoryFormSearchValue) {
    onChange(form);
    setIsFocused(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative h-[32px]">
      <div className="absolute left-[8px] top-1/2 -translate-y-1/2 text-[#c2c4c8]">
        <Search size={16} />
      </div>
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#46474c]"
          aria-label="검색어 삭제"
        >
          <X size={16} />
        </button>
      ) : null}
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (disabled && onDisabledClick) {
            onDisabledClick();
            inputRef.current?.blur();
            return;
          }
          setIsFocused(true);
        }}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 200);
        }}
        placeholder="서식명"
        className="h-full pl-[30px] pr-[30px] text-[13px] border-[#c2c4c8]"
      />

      {isDropdownOpen
        ? createPortal(
          <div
            // className="fixed bg-white border border-[#180f38] rounded-[6px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.16)] z-[99999] overflow-hidden px-0 py-[12px]"
            className="fixed bg-white border border-[#180f38] rounded-[6px] z-[99999] overflow-hidden px-0 py-[12px]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="flex flex-col">
              <div className="flex flex-col">
                {highlightedForms.length === 0 ? (
                  <div className="flex min-h-[120px] justify-center items-center px-[16px]">
                    <p className="text-[13px] text-[#70737c] text-center">
                      검색 결과가 없습니다.
                    </p>
                  </div>
                ) : (
                  highlightedForms.map((form) => (
                    <button
                      key={form.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectForm({ id: form.id, name: form.name })}
                      className="w-full flex items-start justify-between px-[16px] py-[8px] hover:bg-gray-50"
                    >
                      <div className="text-left">
                        <p className="text-[14px] font-bold leading-[1.25] tracking-[-0.14px]">
                          {highlightText(form.name, debouncedQuery)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )
        : null}
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(function updateDebouncedValueOnChange() {
    function updateDebouncedValue() {
      setDebouncedValue(value);
    }
    const handler = setTimeout(updateDebouncedValue, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function highlightText(text: string, searchQuery: string) {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery || !text) {
    return <>{text}</>;
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const matchRegex = new RegExp(`^${escapedQuery}$`, 'i');
        const isMatched = matchRegex.test(part);

        return isMatched ? (
          <span key={index} className="text-[#4F29E5] font-bold">
            {part}
          </span>
        ) : (
          <span key={index} className="text-[#171719]">
            {part}
          </span>
        );
      })}
    </>
  );
}


