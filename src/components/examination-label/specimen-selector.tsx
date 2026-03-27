"use client";

/**
 * 검체 선택 드롭다운 컴포넌트
 *
 * 검체 마스터에서 검체를 선택하여 추가할 수 있습니다.
 */

import { PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Specimen, SpecimenPrintItem } from "@/lib/label-printer";

interface SpecimenSelectorProps {
  /** 검체 마스터 목록 */
  specimens: Specimen[];
  /** 이미 추가된 검체 목록 (중복 방지) */
  selectedSpecimens: SpecimenPrintItem[];
  /** 검체 선택 핸들러 */
  onSelect: (specimen: Specimen) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export function SpecimenSelector({
  specimens,
  selectedSpecimens,
  onSelect,
  disabled = false,
}: SpecimenSelectorProps) {
  // 이미 추가된 검체 코드 목록
  const selectedCodes = new Set(selectedSpecimens.map((s) => s.specimenCode));

  // 추가 가능한 검체 목록 (이미 추가된 검체 제외)
  const availableSpecimens = specimens.filter((s) => !selectedCodes.has(s.specimenCode));

  const handleValueChange = (value: string) => {
    const specimen = specimens.find((s) => s.specimenCode === value);
    if (specimen) {
      onSelect(specimen);
    }
  };

  const hasAvailableSpecimens = availableSpecimens.length > 0;

  return (
    <Select
      value=""
      onValueChange={handleValueChange}
      disabled={disabled || !hasAvailableSpecimens}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <PlusIcon className="size-4" />
          <SelectValue placeholder={hasAvailableSpecimens ? "검체 추가" : "추가할 검체 없음"} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableSpecimens.map((specimen) => (
          <SelectItem key={specimen.specimenCode} value={specimen.specimenCode}>
            {specimen.specimenName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
