"use client";

import { ArrowUpDown, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AppointmentStatus,
  type PaymentStatus,
} from "@/constants/common/common-enum";
import { SORT_OPTIONS } from "@/constants/reception";
import {
  getStatusTabsByPanelType,
  getTitleLabelByPanelType,
} from "./custom-docking-panel-configs";
import { useMemo, useCallback, useEffect, useRef } from "react";

/**
 * CustomDockingPanelHeader
 *
 * 기존 DockingPanelHeader와 동일한 기능을 제공하되,
 * 커스텀 DockWorkspace와 연동된다.
 */

// ===== Type Definitions =====

export interface DropdownConfig {
  items?: Array<{ key: string; value: string; label?: string }>;
  placeholder?: string;
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  multiSelect?: boolean;
  selectedValues?: string[];
  onValuesChange?: (values: string[]) => void;
}

export interface HeaderOptions {
  showIcon?: boolean;
  icon?: string | null;
  defaultIcon?: string;
  title: string;
  titleLabel?: string;
  showDropdown?: boolean;
  dropdownConfig?: DropdownConfig;
  showStatusTabs?: boolean;
  statusTabs?: Array<{ key: string; label: string; icon?: string }>;
  singleSelect?: boolean;
  showSort?: boolean;
  sortOptions?: Array<{ key: string; label: string }>;
  theme?: "light" | "dark";
  className?: string;
  headerClassName?: string;
  tabsClassName?: string;
}

interface CustomDockingPanelHeaderProps {
  itemCount: number;
  selectedStatus: string[];
  onStatusChange: (statuses: string[]) => void;
  sortOrder: string;
  onSortChange: (order: string) => void;
  options: HeaderOptions;
}

// ===== Main Component =====

export const CustomDockingPanelHeader: React.FC<CustomDockingPanelHeaderProps> = ({
  itemCount,
  selectedStatus,
  onStatusChange,
  sortOrder,
  onSortChange,
  options,
}) => {
  const {
    title = "",
    titleLabel,
    showDropdown = false,
    dropdownConfig,
    showStatusTabs = false,
    statusTabs,
    singleSelect = false,
    showSort = false,
    sortOptions = SORT_OPTIONS,
    theme = "light",
    className = "",
    headerClassName = "",
    tabsClassName = "",
  } = options;

  const finalStatusTabs = useMemo(
    () => statusTabs || getStatusTabsByPanelType(title),
    [statusTabs, title]
  );

  const normalizeStoredStatuses = useCallback(
    (rawValue: string | null) => {
      if (!rawValue) return null;

      const toArray = (value: unknown): string[] => {
        if (Array.isArray(value)) return value.map((item) => item?.toString?.() || "").filter(Boolean);
        if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
        return [];
      };

      const parseWithFallback = (): string[] | null => {
        try {
          return toArray(JSON.parse(rawValue));
        } catch {
          const trimmed = rawValue.replace(/^\s*\[?|\]?\s*$/g, "");
          const manual = trimmed.split(",").map((v) => v.trim()).filter(Boolean);
          return manual.length > 0 ? manual : null;
        }
      };

      const normalized = (parseWithFallback() || [])
        .flatMap((item) => item.split(",").map((v) => v.trim()))
        .filter(Boolean);

      if (normalized.length === 0) return null;

      const deduped = Array.from(new Set(normalized));
      const validStatuses = deduped.filter(
        (status) =>
          status === "all" ||
          finalStatusTabs.some((tab) => tab.key.toString() === status.toString())
      );

      return validStatuses.length > 0 ? validStatuses : null;
    },
    [finalStatusTabs]
  );

  const areStatusesEqual = useCallback((a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
  }, []);

  const finalTitleLabel = useMemo(
    () => titleLabel || getTitleLabelByPanelType(title),
    [titleLabel, title]
  );

  const dropdownOptions = useMemo(() => {
    if (!dropdownConfig?.items) return [];
    return dropdownConfig.items.map((item) => ({
      key: item.key,
      value: item.value,
      label: item.label || item.value,
    }));
  }, [dropdownConfig]);

  const storageKey = useMemo(
    () => `custom-docking-panel-status-${title}`,
    [title]
  );

  const isInitialMount = useRef(true);
  const hasLoadedFromStorage = useRef(false);
  const pendingLoadedStatus = useRef<string[] | null>(null);

  // localStorage에서 상태 복원
  useEffect(() => {
    if (!showStatusTabs || !isInitialMount.current) return;

    try {
      const rawValue = localStorage.getItem(storageKey);
      const savedStatus = normalizeStoredStatuses(rawValue);

      if (savedStatus && !areStatusesEqual(savedStatus, selectedStatus)) {
        pendingLoadedStatus.current = savedStatus;
        onStatusChange(savedStatus);
      }
    } catch (error) {
      console.error("Failed to load status from localStorage:", error);
    } finally {
      hasLoadedFromStorage.current = true;
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, showStatusTabs, finalStatusTabs, normalizeStoredStatuses, areStatusesEqual, selectedStatus]);

  // localStorage에 상태 저장
  useEffect(() => {
    if (!showStatusTabs || isInitialMount.current || !hasLoadedFromStorage.current) return;

    try {
      if (pendingLoadedStatus.current && !areStatusesEqual(selectedStatus, pendingLoadedStatus.current)) {
        return;
      }

      if (pendingLoadedStatus.current && areStatusesEqual(selectedStatus, pendingLoadedStatus.current)) {
        pendingLoadedStatus.current = null;
      }

      if (selectedStatus.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(selectedStatus));
      }
    } catch (error) {
      console.error("Failed to save status to localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, storageKey, showStatusTabs]);

  // 빈 선택 시 자동 선택
  useEffect(() => {
    if (isInitialMount.current) return;

    if (showStatusTabs && !singleSelect && selectedStatus.length === 0 && finalStatusTabs.length > 0) {
      onStatusChange(["all"]);
    }
    if (showStatusTabs && singleSelect && selectedStatus.length === 0 && finalStatusTabs.length > 0) {
      const firstTab = finalStatusTabs[0];
      if (firstTab) {
        onStatusChange([firstTab.key.toString()]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus.length, showStatusTabs, finalStatusTabs.length, singleSelect]);

  const themeStyles = useMemo(() => {
    const styles = {
      light: {
        textSecondary: "text-gray-600",
        textAccent: "text-orange-500",
      },
      dark: {
        textSecondary: "text-gray-400",
        textAccent: "text-orange-400",
      },
    };
    return styles[theme];
  }, [theme]);

  // ===== Status Toggle =====
  const handleStatusToggle = useCallback(
    (tabKey: string) => {
      const key = tabKey.toString();
      const currentStatuses = selectedStatus || [];

      if (singleSelect) {
        if (currentStatuses.includes(key)) return;
        onStatusChange([key]);
        return;
      }

      const isAll = key === "all";

      if (isAll) {
        if (currentStatuses.includes("all")) {
          onStatusChange([]);
        } else {
          onStatusChange(["all"]);
        }
        return;
      }

      let newStatuses = currentStatuses.includes("all") ? [] : [...currentStatuses];

      if (newStatuses.includes(key)) {
        newStatuses = newStatuses.filter((s) => s !== key);
      } else {
        newStatuses.push(key);
      }

      if (newStatuses.length === 0) {
        onStatusChange(["all"]);
        return;
      }

      const allStatusKeys = finalStatusTabs
        .map((tab) => tab.key.toString())
        .filter((k) => k !== "all");

      const allOtherSelected =
        allStatusKeys.length > 0 && allStatusKeys.every((k) => newStatuses.includes(k));

      if (allOtherSelected && newStatuses.length === allStatusKeys.length) {
        onStatusChange(["all"]);
      } else {
        onStatusChange(newStatuses);
      }
    },
    [selectedStatus, onStatusChange, finalStatusTabs, singleSelect]
  );

  // ===== Render =====
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <header className={`flex flex-wrap items-center justify-between gap-2 w-full ${headerClassName}`}>
        <div className="flex gap-2 items-center shrink-0">
          <span className={`text-sm ${themeStyles.textSecondary}`}>
            {finalTitleLabel}
          </span>
          <span className={`text-[13px] ${themeStyles.textAccent}`}>
            {itemCount}명
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-normal flex-1 justify-end min-w-0">
          {showStatusTabs && (
            <nav
              className={`flex flex-wrap ${singleSelect
                ? "bg-[var(--bg-1)] rounded-xs p-1 gap-0"
                : "gap-1"
                } ${tabsClassName}`}
            >
              {finalStatusTabs.map(
                (tab: { key: string | AppointmentStatus | PaymentStatus; label: string; icon?: string }) => {
                  const tabKey = tab.key.toString();
                  const isSelected =
                    selectedStatus.includes("all") && tabKey === "all"
                      ? true
                      : selectedStatus.includes("all")
                        ? false
                        : selectedStatus.includes(tabKey);

                  return (
                    <StatusTab
                      key={tabKey}
                      tab={tab}
                      isSelected={isSelected}
                      onClick={() => handleStatusToggle(tabKey)}
                      singleSelect={singleSelect}
                    />
                  );
                }
              )}
            </nav>
          )}

          {showDropdown && dropdownConfig && dropdownOptions.length > 0 && (
            <DropdownSelector options={dropdownOptions} config={dropdownConfig} theme={theme} />
          )}

          {showSort && (
            <SortDropdown
              sortOptions={sortOptions}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              theme={theme}
            />
          )}
        </div>
      </header>
    </div>
  );
};

// ===== Sub Components =====

interface StatusTabProps {
  tab: { key: string | AppointmentStatus | PaymentStatus; label: string; icon?: string };
  isSelected: boolean;
  onClick: () => void;
  singleSelect?: boolean;
}

const StatusTab: React.FC<StatusTabProps> = ({ tab, isSelected, onClick, singleSelect = false }) => {
  if (singleSelect) {
    return (
      <button
        className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[12px] font-semibold transition-colors cursor-pointer
          ${isSelected
            ? "bg-[var(--bg-main)] text-[var(--gray-100)]"
            : "bg-transparent text-[var(--gray-300)]"
          }`}
        onClick={onClick}
        type="button"
      >
        {tab.icon && <span>{tab.icon}</span>}
        <span>{tab.label}</span>
      </button>
    );
  }

  return (
    <button
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] border transition-colors cursor-pointer
        ${isSelected
          ? "bg-[var(--main-color)] text-[var(--fg-invert)] border-[var(--main-color)]"
          : "border-[var(--border-1)] text-[var(--gray-300)] bg-transparent"
        }`}
      onClick={onClick}
      type="button"
    >
      {tab.icon && <span>{tab.icon}</span>}
      <span>{tab.label}</span>
    </button>
  );
};

interface SortDropdownProps {
  sortOptions: Array<{ key: string; label: string }>;
  sortOrder: string;
  onSortChange: (order: string) => void;
  theme: "light" | "dark";
}

const SortDropdown: React.FC<SortDropdownProps> = ({ sortOptions, sortOrder, onSortChange }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" className="cursor-pointer hover:text-blue-600 focus:outline-none" tabIndex={0}>
        <ArrowUpDown size={16} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {sortOptions.map((option) => (
        <DropdownMenuItem
          key={option.key}
          onClick={() => onSortChange(option.key)}
          className={sortOrder === option.key ? "font-bold text-blue-600" : ""}
        >
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

interface DropdownSelectorProps {
  options: Array<{ key: string; value: string; label: string }>;
  config: DropdownConfig;
  theme: "light" | "dark";
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({ options, config }) => {
  const {
    placeholder = "전체",
    selectedValue,
    onValueChange,
    multiSelect = false,
    selectedValues = [],
    onValuesChange,
  } = config;

  const handleToggleValue = (key: string) => {
    if (multiSelect && onValuesChange) {
      const newValues = selectedValues.includes(key)
        ? selectedValues.filter((v) => v !== key)
        : [...selectedValues, key];
      onValuesChange(newValues);
    } else if (!multiSelect && onValueChange) {
      onValueChange(key);
    }
  };

  const handleSelectAll = () => {
    if (!multiSelect || !onValuesChange) return;
    const allKeys = options.map((opt) => opt.key);
    const isAllSelected = selectedValues.length === allKeys.length || selectedValues.includes("all");
    if (isAllSelected) {
      onValuesChange([]);
    } else {
      onValuesChange(allKeys);
    }
  };

  const displayText = multiSelect
    ? selectedValues.length === 0
      ? "미선택"
      : selectedValues.length === options.length
        ? placeholder
        : selectedValues.length === 1
          ? options.find((opt) => opt.key === selectedValues[0])?.label || placeholder
          : selectedValues.map((key) => options.find((opt) => opt.key === key)?.label).filter(Boolean).join(", ")
    : (() => {
      const selectedOption = options.find((opt) => opt.key === selectedValue);
      return selectedOption ? selectedOption.label : placeholder;
    })();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="text-xs min-w-28 !h-6 py-0 flex items-center justify-between gap-1 border-gray-200">
          <span className="flex justify-center items-center w-full truncate">{displayText}</span>
          <ChevronDown className="w-4 h-4 opacity-20 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48">
        {multiSelect && (
          <DropdownMenuItem onClick={handleSelectAll} className="border-b border-gray-100">
            <div className="flex items-center gap-2 w-full">
              <div className="w-4 h-4 flex items-center justify-center">
                {selectedValues.length === options.length && selectedValues.length > 0 ? (
                  <Check className="w-3 h-3 text-blue-600" />
                ) : (
                  <div className="w-3 h-3 border border-gray-300 rounded" />
                )}
              </div>
              <span className="text-sm">전체 선택</span>
            </div>
          </DropdownMenuItem>
        )}
        {options.map((option) => (
          <DropdownMenuItem key={option.key} onClick={() => handleToggleValue(option.key)} className="cursor-pointer">
            <div className="flex items-center gap-2 w-full">
              <div className="w-4 h-4 flex items-center justify-center">
                {multiSelect ? (
                  selectedValues.includes(option.key) ? (
                    <Check className="w-3 h-3 text-blue-600" />
                  ) : (
                    <div className="w-3 h-3 border border-gray-300 rounded" />
                  )
                ) : selectedValue === option.key ? (
                  <Check className="w-3 h-3 text-blue-600" />
                ) : (
                  <div className="w-3 h-3 border border-gray-300 rounded" />
                )}
              </div>
              <span className="text-sm">{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
