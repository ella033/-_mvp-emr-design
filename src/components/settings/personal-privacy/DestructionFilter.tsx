"use client";

import InputDateRange from "@/components/ui/input-date-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterContainer,
  FilterRow,
  FilterItem,
  FilterLabel,
  FilterDescription
} from "./commons/filter-components";

interface DestructionFilterProps {
  startDate: string;
  endDate: string;
  onDateChange: (range: { from: string; to: string }) => void;
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
  fiveYearsAgo: string; // YYYY-MM-DD
}

export function DestructionFilter({
  startDate,
  endDate,
  onDateChange,
  documentType,
  onDocumentTypeChange,
  fiveYearsAgo,
}: DestructionFilterProps) {

  return (
    <FilterContainer>
      <FilterRow>
        <FilterItem width="300px">
          <FilterLabel>파기 문서</FilterLabel>
          <Select value={documentType} onValueChange={onDocumentTypeChange}>
            <SelectTrigger className="h-8 w-full px-3 rounded-md outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
              <SelectValue placeholder="문서 유형 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLAIM">청구명세서</SelectItem>
              <SelectItem value="MATERIAL_REPORT">치료재료대</SelectItem>
              <SelectItem value="MIXTURE_REPORT">자체 조제 · 제제약</SelectItem>
            </SelectContent>
          </Select>
        </FilterItem>

        <FilterItem className="flex-1">
          <FilterLabel>조회 기간</FilterLabel>
          <InputDateRange
            fromValue={startDate}
            toValue={endDate}
            onChange={onDateChange}
            className="w-[300px]"
          />
          <FilterDescription>
            *청구명세서는 5년의 필수 보유기간이 지난 문서만 조회할 수 있습니다.
          </FilterDescription>
        </FilterItem>
      </FilterRow>
    </FilterContainer>
  );
}
