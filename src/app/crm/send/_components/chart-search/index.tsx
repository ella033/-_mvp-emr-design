import React from "react";
import SearchBar from "@/components/search-bar";
import type { Patient } from "@/types/patient-types";

interface ChartSearchProps {
  onPatientSelect?: (patient: Patient) => void;
}

/**
 * 개별 검색 컴포넌트
 * CRM 발송 대상을 개별적으로 검색하는 기능을 제공합니다.
 * 발송 가능 여부 검증은 page.tsx의 useManualSendEligibility에서 처리합니다.
 */
export default function ChartSearch({ onPatientSelect }: ChartSearchProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] border-r border-[var(--border-2)] shadow-[0_0_4px_0_rgba(0,0,0,0.06)]">
      <div className="p-4">
        <SearchBar
          widthClassName="w-full"
          onPatientSelect={(patient: Patient) => onPatientSelect?.(patient)}
          disableDefaultBehavior={true}
          placeholder="차트번호, 이름, 생년월일로 검색하세요"
          inputTestId="crm-individual-search-input"
          dropdownTestId="crm-individual-search-dropdown"
        />
      </div>
    </div>
  );
}
