'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import type { Patient } from '@/types/patient-types';
import { useSearchPatients } from '@/hooks/patient/use-search-patients';
import { formatPhoneNumber, getAgeOrMonth, getGender } from '@/lib/patient-utils';
import { formatRrnNumber } from '@/lib/common-utils';
import { useDocumentContext } from '../_contexts/DocumentContext';

const MEMO_ICON_SRC = '/note.svg';

// 커스텀 useDebounce 훅 구현
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
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

function DocumentPatientSearchBarContent({
  onPatientSelect,
}: {
  onPatientSelect?: (patient: Patient) => void;
}) {
  const { selectedPatient, trySetSelectedPatient } = useDocumentContext();
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


  // 드롭다운 위치 계산 함수
  function updateDropdownPosition() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();

      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }

  // focus 상태 변경 시 위치 업데이트
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(updateDropdownPosition, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFocused]);

  function handlePatientSelect(patient: Patient) {
    // dirty 체크 포함하여 환자 변경 시도
    trySetSelectedPatient(patient);

    // 추가 콜백이 있으면 호출
    if (onPatientSelect) {
      onPatientSelect(patient);
    }

    setIsFocused(false);
    setQuery('');
    inputRef.current?.blur();
  }

  function handleClearSelection() {
    // dirty 체크 포함하여 환자 해제 시도
    trySetSelectedPatient(null);
    setQuery('');
    inputRef.current?.focus();
  }

  const debouncedQuery = useDebounce(query, 300);

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

  // 검색 파라미터 생성
  const params: Record<string, any> = {
    take: 20,
    sortBy: 'id',
    sortOrder: 'desc',
    search: debouncedQuery,
  };

  // React Query 훅 사용
  const { data, isError } = useSearchPatients(params);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredPatients([]);
      setHasSearched(false);
      return;
    }
    if (data && (data as any).items) {
      const patients: Patient[] = ((data as any).items || []).map(
        (item: any) => ({
          phone: item.phone1 ?? item.phone2 ?? '',
          ...item,
        })
      );
      setFilteredPatients(patients);
      setHasSearched(true);
    } else if (isError) {
      setFilteredPatients([]);
      setHasSearched(true);
    }
  }, [debouncedQuery, data, isError]);

  // 선택된 환자가 있으면 환자 정보 표시, 없으면 검색 입력창 표시
  if (selectedPatient) {
    return (
      <div className="w-full h-11 bg-white border-b border-gray-300 flex items-center px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
            {selectedPatient.patientNo}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {selectedPatient.name}
          </span>
          <span className="text-xs font-bold text-gray-500">
            ({getGender(selectedPatient.gender, 'ko')}/{getAgeOrMonth(selectedPatient.birthDate || '', 'en')})
          </span>
          <span className="text-xs font-medium text-gray-500">
            / {formatRrnNumber(selectedPatient.rrn)}
          </span>
        </div>
        <button
          onClick={handleClearSelection}
          className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors ml-[12px]"
          aria-label="환자 선택 해제"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-11 bg-white border-b border-gray-300 flex items-center px-4 shadow-sm">
      <div className="relative w-full">
        <Search className="absolute left-0 top-1/2 w-4 h-4 -translate-y-1/2 pointer-events-none text-gray-500" />
        <Input
          ref={inputRef}
          placeholder="선택된 환자가 없습니다. 환자를 검색해 주세요."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-6 h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 shadow-none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // 드롭다운 클릭을 위해 약간의 지연
            setTimeout(() => setIsFocused(false), 200);
          }}
        />
        {/* 검색 결과 */}
        {isFocused &&
          debouncedQuery.trim() &&
          (filteredPatients.length > 0 ||
            (hasSearched && filteredPatients.length === 0)) &&
          createPortal(
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
                          className={`flex flex-col cursor-pointer hover:bg-gray-50 transition-colors rounded-[4px] gap-[5px] ${index === 0 ? 'bg-[#f7f7f8]' : 'bg-white'} ${index > 0 ? 'mt-0' : ''}`}
                          onClick={() => handlePatientSelect(patient)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center h-8 px-2 gap-[6px]">
                            <span className="inline-flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none flex-shrink-0">
                              {highlightText(
                                String(patient.patientNo),
                                query
                              )}
                            </span>
                            <div className="text-[13px] font-bold text-[#292a2d] leading-[1.25] tracking-[-0.13px] whitespace-nowrap">
                              {highlightText(patient.name || '', query)}{' '}
                              <span className="ml-[2px]">
                                ({getGender(patient.gender, 'ko')}/{getAgeOrMonth(patient.birthDate || '', 'en')})
                              </span>
                            </div>
                            {hasRrn ? (
                              <div className="text-[13px] text-[#292a2d] leading-[1.25] tracking-[-0.13px] whitespace-nowrap pl-[6px]">
                                {highlightText(rrnText, query)}
                              </div>
                            ) : null}
                            {hasRrn ? (
                              <span className="h-[12px] w-px bg-[#c2c4c8] flex-shrink-0" aria-hidden />
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
                                <img src={MEMO_ICON_SRC} alt="" className="block max-w-none size-full" />
                              </span>
                              <span className="truncate">{highlightText(memoText, query)}</span>
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
          )}
      </div>
    </div>
  );
}

export default function DocumentPatientSearchBar({
  onPatientSelect,
}: {
  onPatientSelect?: (patient: Patient) => void;
}) {
  return <DocumentPatientSearchBarContent onPatientSelect={onPatientSelect} />;
}
