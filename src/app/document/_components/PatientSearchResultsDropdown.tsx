'use client';

import { createPortal } from 'react-dom';
import type { Patient } from '@/types/patient-types';
import { formatPhoneNumber, getAgeOrMonth, getGender } from '@/lib/patient-utils';
import { formatRrnNumber } from '@/lib/common-utils';

const MEMO_ICON_SRC = '/note.svg';

export type PatientSearchDropdownPosition = {
  top: number;
  left: number;
  width: number;
};

export function PatientSearchResultsDropdown({
  isOpen,
  query,
  patients,
  hasSearched,
  dropdownPosition,
  onSelectPatient,
}: {
  isOpen: boolean;
  query: string;
  patients: Array<Patient & Record<string, any>>;
  hasSearched: boolean;
  dropdownPosition: PatientSearchDropdownPosition;
  onSelectPatient: (patient: Patient) => void;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-white rounded-[6px] shadow-lg border border-[#dbdcdf] z-[99999] overflow-hidden py-2 px-2 max-w-[580px]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      {patients.length > 0 ? (
        <div className="overflow-y-auto max-h-[400px]">
          <div className="w-full flex flex-col">
            {patients.map((patient: any, index: number) => {
              const memoText = (patient.memo || patient.patientMemo || '').replace(/<[^>]*>/g, '');
              const rrnText = formatRrnNumber(patient.rrn);
              const hasRrn = Boolean(rrnText);

              return (
                <div
                  key={patient.id}
                  className={`flex flex-col cursor-pointer hover:bg-gray-50 transition-colors rounded-[4px] gap-[5px] ${index === 0 ? 'bg-[#f7f7f8]' : 'bg-white'
                    } ${index > 0 ? 'mt-0' : ''}`}
                  onClick={() => onSelectPatient(patient)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="flex items-center h-8 px-2 gap-[6px]">
                    <div className="text-[13px] font-bold text-[#292a2d] leading-[1.25] tracking-[-0.13px] whitespace-nowrap">
                      {highlightText(patient.name || '', query)}{' '}
                      <span className="ml-[2px]">
                        ({getAgeOrMonth(patient.birthDate || '', 'ko')}{' '}
                      </span>
                      <span className="ml-[2px]">{getGender(patient.gender, 'ko')})</span>
                      <span className="inline-flex items-center justify-center rounded-[4px] bg-[#f4f4f5] px-[6px] py-[2px] ml-[4px] text-[11px] font-bold leading-[1.25] tracking-[-0.11px] text-[#70737c] flex-shrink-0">
                        {highlightText(String(patient.patientNo), query)}
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
      ) : hasSearched ? (
        <div className="flex min-h-[200px] justify-center items-center">
          <p className="text-[13px] text-gray-500 text-center">검색 결과가 없습니다.</p>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

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


