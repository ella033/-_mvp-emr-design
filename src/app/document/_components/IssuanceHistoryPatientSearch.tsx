'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Patient } from '@/types/patient-types';
import { useSearchPatients } from '@/hooks/patient/use-search-patients';
import { formatPhoneNumber, getAgeOrMonth, getGender } from '@/lib/patient-utils';
import { formatRrnNumber } from '@/lib/common-utils';

const MEMO_ICON_SRC = '/note.svg';

export function IssuanceHistoryPatientSearch({
  value,
  onChange,
  disabled,
  onDisabledClick,
}: {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  disabled?: boolean;
  onDisabledClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const debouncedQuery = useDebounce(query, 300);

  const params: Record<string, any> = {
    take: 20,
    sortBy: 'id',
    sortOrder: 'desc',
    search: debouncedQuery,
  };

  const { data, isError } = useSearchPatients(params);

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

  useEffect(function applyPatientSearchResults() {
    if (!debouncedQuery.trim()) {
      setFilteredPatients([]);
      setHasSearched(false);
      return;
    }

    if (data && (data as any).items) {
      const patients: Patient[] = ((data as any).items || []).map((item: any) => ({
        phone: item.phone1 ?? item.phone2 ?? '',
        ...item,
      }));
      setFilteredPatients(patients);
      setHasSearched(true);
      return;
    }

    if (isError) {
      setFilteredPatients([]);
      setHasSearched(true);
    }
  }, [debouncedQuery, data, isError]);

  const isDropdownOpen =
    isFocused &&
    debouncedQuery.trim() &&
    (filteredPatients.length > 0 ||
      (hasSearched && filteredPatients.length === 0));

  function handleSelectPatient(patient: Patient) {
    onChange(patient);
    setIsFocused(false);
    inputRef.current?.blur();
  }

  function handleClearSelection() {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }

  // 검색어 하이라이트 함수
  function highlightText(text: string, searchQuery: string) {
    if (!searchQuery.trim() || !text) {
      return <>{text}</>;
    }

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
            <span key={index}>{part}</span>
          );
        })}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[32px]">
      <div className="absolute left-[8px] top-1/2 -translate-y-1/2 text-[#c2c4c8]">
        <Search size={16} />
      </div>
      {query ? (
        <button
          type="button"
          onClick={handleClearSelection}
          className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#46474c]"
          aria-label="환자 선택 해제"
        >
          <X size={16} />
        </button>
      ) : null}
      <Input
        ref={inputRef}
        placeholder="환자명/차트번호"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-full pl-[30px] pr-[30px] text-[13px] border-[#c2c4c8]"
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
      />

      {isDropdownOpen
        ? createPortal(
          <div
            className="fixed bg-white rounded-[6px] shadow-lg border border-[#dbdcdf] z-[99999] overflow-hidden max-w-[580px]"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#f0f0f2]">
              <p className="text-xs text-gray-500">검색결과</p>
            </div>
            {filteredPatients.length > 0 ? (
              <div className="overflow-y-auto max-h-[400px] px-2 py-2">
                <div className="w-full flex flex-col">
                  {filteredPatients.map((patient: any, index: number) => {
                    const memoText = (patient.memo || patient.patientMemo || '').replace(/<[^>]*>/g, '');
                    const rrnText = formatRrnNumber(patient.rrn);
                    const hasRrn = Boolean(rrnText);
                    return (
                      <div
                        key={patient.id}
                        className={`flex flex-col cursor-pointer hover:bg-gray-50 transition-colors rounded-[4px] gap-[5px] ${index === 0 ? 'bg-[#f7f7f8]' : 'bg-white'
                          } ${index > 0 ? 'mt-0' : ''}`}
                        onClick={() => handleSelectPatient(patient)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center h-8 px-2 gap-[6px]">
                          <div className="text-[13px] font-bold text-[#292a2d] leading-[1.25] tracking-[-0.13px] whitespace-nowrap">
                            {highlightText(patient.name || '', query)}{' '}
                            <span className="ml-[2px]">
                              ({getAgeOrMonth(patient.birthDate || '', 'ko')}{' '}
                            </span>
                            <span className="ml-[2px]">
                              {getGender(patient.gender, 'ko')})
                            </span>
                            <span className="inline-flex items-center justify-center rounded-[4px] bg-[#f4f4f5] px-[6px] py-[2px] ml-[4px] text-[11px] font-bold leading-[1.25] tracking-[-0.11px] text-[#70737c] flex-shrink-0">
                              {highlightText(
                                String(patient.patientNo),
                                query
                              )}
                            </span>
                          </div>
                          {hasRrn ? (
                            <div className="text-[13px] text-[#292a2d] leading-[1.25] tracking-[-0.13px] whitespace-nowrap pl-[6px]">
                              {highlightText(rrnText, query)}
                            </div>
                          ) : null}
                          {hasRrn ? (
                            <span
                              className="h-[12px] w-px bg-[#c2c4c8] flex-shrink-0"
                              aria-hidden
                            />
                          ) : null}
                          <div className="text-[13px] text-[#46474c] leading-[1.25] tracking-[-0.13px] whitespace-nowrap">
                            {highlightText(
                              formatPhoneNumber(patient.phone1 || patient.phone || ''),
                              query
                            )}
                          </div>
                        </div>
                        {memoText ? (
                          <div className="flex items-center gap-[6px] px-2 pb-1.5 text-[13px] text-[#70737c] leading-[1.25] tracking-[-0.13px]">
                            <span className="relative flex-shrink-0 size-[12px] overflow-hidden">
                              <img
                                src={MEMO_ICON_SRC}
                                alt=""
                                className="block max-w-none size-full"
                              />
                            </span>
                            <span className="truncate">
                              {highlightText(memoText, query)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[200px] justify-center items-center">
                <p className="text-[13px] text-gray-500 text-center">
                  검색 결과가 없습니다.
                </p>
              </div>
            )}
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
