"use client";

import React, { useMemo, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MultiSelectDropdownOption {
  key: string;
  value: string;
  label?: string;
}

export interface MultiSelectDropdownProps {
  options: MultiSelectDropdownOption[];
  /** 전체 선택 상태 표시 텍스트 (기본값: "전체") */
  placeholder?: string;
  /**
   * 선택된 항목 키 목록.
   * 빈 배열([])은 "전체" 상태를 의미한다.
   */
  selectedValues: string[];
  /** 선택 변경 콜백 */
  onValuesChange: (values: string[]) => void;
  /** 트리거 버튼 커스텀 className */
  className?: string;
}

/**
 * MultiSelectDropdown
 *
 * 정책:
 * 0. selectedValues=[] → 전체 선택 상태 (기본값)
 * 1. 전체 선택 상태에서 단일 항목 클릭 → 해당 항목만 단독 선택
 * 2. 부분 선택 상태에서 다른 항목 클릭 → 기존 선택에 추가
 * 3. 선택된 항목 클릭 → 해제. 마지막 1개 해제 시 전체로 복귀
 * 4. 항목 선택 시 드롭다운이 닫히지 않음 (외부 클릭 시 닫힘)
 */
export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  placeholder = "전체",
  selectedValues,
  onValuesChange,
  className,
}) => {
  const isAllSelected =
    selectedValues.length === 0 || selectedValues.length === options.length;

  const handleItemClick = useCallback(
    (key: string) => {
      if (isAllSelected) {
        // 정책 1: 전체 → 해당 항목만 단독 선택
        onValuesChange([key]);
      } else if (selectedValues.includes(key)) {
        // 정책 3: 선택 해제 (마지막이면 전체 복귀)
        const next = selectedValues.filter((v) => v !== key);
        onValuesChange(next);
      } else {
        // 정책 2: 기존 선택에 추가
        onValuesChange([...selectedValues, key]);
      }
    },
    [isAllSelected, selectedValues, onValuesChange],
  );

  const handleSelectAll = useCallback(() => {
    onValuesChange([]);
  }, [onValuesChange]);

  const displayText = useMemo(() => {
    if (isAllSelected) return placeholder;
    return selectedValues
      .map((key) => {
        const found = options.find((opt) => opt.key === key);
        return found?.label || found?.value || key;
      })
      .join(", ");
  }, [isAllSelected, selectedValues, options, placeholder]);

  const showCount = !isAllSelected && options.length > 1;

  const countText = useMemo(() => {
    return `(${selectedValues.length}/${options.length})`;
  }, [selectedValues.length, options.length]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group flex items-center justify-between gap-1",
            className,
          )}
        >
          {showCount && <span className="text-[var(--gray-300)] shrink-0 text-[0.7em] opacity-0 group-hover:opacity-100 transition-opacity">{countText}</span>}
          <span className="truncate">{displayText}</span>
          <ChevronDown className="w-3 h-3 text-[var(--gray-300)] shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-44">
        {/* 전체 선택 */}
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={handleSelectAll}
          className="border-b border-gray-100 cursor-pointer"
        >
          <div className="flex items-center gap-1 w-full">
            <div className="w-4 h-4 flex items-center justify-center">
              {isAllSelected ? (
                <Check className="w-3 h-3 text-[var(--violet-2)]" />
              ) : (
                <div className="w-3 h-3 border border-gray-300 rounded" />
              )}
            </div>
            <span className="text-sm">전체</span>
          </div>
        </DropdownMenuItem>

        {/* 개별 항목 */}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onSelect={(e) => e.preventDefault()}
            onClick={() => handleItemClick(option.key)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-1 w-full">
              <div className="w-4 h-4 flex items-center justify-center">
                {!isAllSelected && selectedValues.includes(option.key) ? (
                  <Check className="w-3 h-3 text-[var(--violet-2)]" />
                ) : (
                  <div className="w-3 h-3 border border-gray-300 rounded" />
                )}
              </div>
              <span className="text-sm">{option.label || option.value}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
