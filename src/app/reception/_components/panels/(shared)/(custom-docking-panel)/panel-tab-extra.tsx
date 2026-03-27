"use client";

import React from "react";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";

/**
 * PanelTabExtra
 *
 * DockWorkspace의 panelExtra 영역(탭바 우측)에 렌더링되는 컨트롤.
 * 기존 CustomDockingPanelHeader의 드롭다운/명수 표시를 대체한다.
 */

export interface PanelTabExtraConfig {
  /** 명수 표시 */
  itemCount?: number;
  /** 드롭다운 표시 여부 */
  showDropdown?: boolean;
  dropdownOptions?: Array<{ key: string; value: string; label?: string }>;
  dropdownPlaceholder?: string;
  dropdownSelectedValues?: string[];
  onDropdownValuesChange?: (values: string[]) => void;
}

interface PanelTabExtraProps {
  config: PanelTabExtraConfig;
}

export const PanelTabExtra: React.FC<PanelTabExtraProps> = ({ config }) => {
  const {
    showDropdown = false,
    dropdownOptions = [],
    dropdownPlaceholder = "전체",
    dropdownSelectedValues = [],
    onDropdownValuesChange,
  } = config;

  return (
    <div className="flex items-center gap-2 text-xs">
      {showDropdown && dropdownOptions.length > 0 && onDropdownValuesChange && (
        <MultiSelectDropdown
          options={dropdownOptions}
          placeholder={dropdownPlaceholder}
          selectedValues={dropdownSelectedValues}
          onValuesChange={onDropdownValuesChange}
          className="text-xs min-w-24 !h-6 !px-3 py-0 bg-[var(--bg-2)] border-0 shadow-none"
        />
      )}
    </div>
  );
};

// ===== Panel Tab Extra Left (탭바 좌측, 탭 이름 옆) =====

export interface PanelTabExtraLeftConfig {
  /** 명수 표시 */
  itemCount?: number;
  /** 커스텀 렌더링 */
  children?: React.ReactNode;
}

interface PanelTabExtraLeftProps {
  config: PanelTabExtraLeftConfig;
}

export const PanelTabExtraLeft: React.FC<PanelTabExtraLeftProps> = ({ config }) => {
  const { itemCount, children } = config;

  return (
    <div className="flex items-center gap-1 text-xs">
      {itemCount !== undefined && (
        <span className="text-[var(--second-color)] text-[13px] shrink-0 font-semibold">
          {itemCount}
        </span>
      )}
      {children}
    </div>
  );
};

