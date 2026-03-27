"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import {
  GRID_FONT_SIZE_CLASS
} from "@/components/yjg/common/constant/class-constants";
import { useUsages } from "@/hooks/usage/use-usage";
import type { UsageCode } from "@/types/usage-code-types";
import { cn } from "@/lib/utils";
import MyDropDown from "@/components/yjg/my-drop-down";
import { UsageCategory } from "@/constants/common/common-enum";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";
import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import UsageAdd from "./usage-add";
import { useToastHelpers } from "@/components/ui/toast";
import { highlightKeyword } from "@/components/yjg/common/util/ui-util";

interface UsageInputProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  itemType?: string;
  currentUsage: string;
  onChange: (usageCode: UsageCode | null, usageText: string) => void;
  readonly?: boolean;
}

export default function UsageInput({
  size,
  itemType,
  currentUsage,
  onChange,
  readonly = false,
}: UsageInputProps) {
  const { data: usageCodes } = useUsages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState(currentUsage);
  const [isOpen, setIsOpen] = useState(false);
  /** 드롭다운 열렸을 때 입력/검색에 쓰는 값. 열 때 usage로 초기화해 하나처럼 보이게 함 */
  const [inputValue, setInputValue] = useState(currentUsage);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isUsageAddOpen, setIsUsageAddOpen] = useState(false);
  const justSelectedFromListRef = useRef(false);
  const justClearedRef = useRef(false);

  useEffect(() => {
    setUsage(currentUsage);
  }, [currentUsage]);

  const tooltipText = useMemo(
    () =>
      usageCodes?.find((uc) => uc.code === usage)?.usage ?? usage,
    [usage, usageCodes]
  );

  const allowedCategory = useMemo((): UsageCategory | null => {
    switch (itemType) {
      case ItemTypeCode.투약료_내복약:
        return UsageCategory.INTERNAL;
      case ItemTypeCode.투약료_외용약:
        return UsageCategory.EXTERNAL;
      case ItemTypeCode.주사료_주사:
        return UsageCategory.INJECTION;
      default:
        return null;
    }
  }, [itemType]);

  const filteredUsageCodes = useMemo(() => {
    if (!usageCodes) return [];
    if (!allowedCategory) return usageCodes;
    return usageCodes.filter(
      (u) =>
        u.category === UsageCategory.COMMON || u.category === allowedCategory
    );
  }, [usageCodes, allowedCategory]);

  const searchFilteredList = useMemo(() => {
    if (!inputValue.trim()) return filteredUsageCodes;
    const lower = inputValue.toLowerCase().trim();
    const filtered = filteredUsageCodes.filter(
      (u) =>
        (u.code ?? "").toLowerCase().includes(lower) ||
        (u.usage ?? "").toLowerCase().includes(lower)
    );
    // 완전일치 > 접두일치 > 알파벳순
    return [...filtered].sort((a, b) => {
      const getPriority = (item: UsageCode) => {
        const code = (item.code ?? "").toLowerCase();
        const usageText = (item.usage ?? "").toLowerCase();
        if (code === lower || usageText === lower) return 0;
        if (code.startsWith(lower) || usageText.startsWith(lower)) return 1;
        return 2;
      };

      const aPriority = getPriority(a);
      const bPriority = getPriority(b);
      if (aPriority !== bPriority) return aPriority - bPriority;

      return (
        (a.usage ?? "").toLowerCase().localeCompare((b.usage ?? "").toLowerCase()) ||
        (a.code ?? "").toLowerCase().localeCompare((b.code ?? "").toLowerCase())
      );
    });
  }, [filteredUsageCodes, inputValue]);

  const applySelection = useCallback(
    (usageCode: UsageCode | null, usageText: string) => {
      setUsage(usageText);
      onChange(usageCode, usageText);
      setIsOpen(false);
      setInputValue(usageText);
      setSelectedIndex(-1);
    },
    [onChange]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    setInputValue(usage);
    setSelectedIndex(-1);
    return undefined;
  }, [isOpen, usage]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex((prev) => {
      if (searchFilteredList.length === 0) return -1;
      if (!inputValue.trim()) return -1;
      if (prev < 0) return -1;
      return Math.min(prev, searchFilteredList.length - 1);
    });
  }, [searchFilteredList.length, inputValue, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        setInputValue(usage);
      }
      setSelectedIndex((prev) =>
        prev < searchFilteredList.length - 1 ? prev + 1 : prev
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      if (!isOpen) {
        setIsOpen(true);
        setInputValue(usage);
      }
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchFilteredList.length === 0) {
        applySelection(null, inputValue.trim());
        return;
      }
      if (selectedIndex >= 0 && selectedIndex < searchFilteredList.length) {
        const selected = searchFilteredList[selectedIndex];
        if (selected) applySelection(selected, selected.usage);
        return;
      }
      const match = filteredUsageCodes.find(
        (u) => (u.usage ?? "").toLowerCase() === inputValue.trim().toLowerCase()
      );
      if (match) {
        applySelection(match, match.usage ?? inputValue);
      } else {
        applySelection(null, inputValue.trim());
      }
    }
  };

  const handleSelectItem = (usageCode: UsageCode) => {
    justSelectedFromListRef.current = true;
    applySelection(usageCode, usageCode.usage ?? "");
  };

  const handleClear = useCallback(() => {
    justClearedRef.current = true;
    applySelection(null, "");
  }, [applySelection]);

  const { success } = useToastHelpers();

  if (readonly) {
    return (
      <MyTooltip side="left" align="start" content={tooltipText}>
        <div
          className={cn(
            "flex flex-1 min-w-0 h-full w-full items-center m-[1px] text-ellipsis overflow-hidden whitespace-nowrap cursor-default",
            GRID_FONT_SIZE_CLASS[size]
          )}
          aria-label="용법 (읽기 전용)"
        >
          {usage || "\u00A0"}
        </div>
      </MyTooltip>
    );
  }

  return (
    <>
      <MyDropDown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <MyTooltip side="left" align="start" content={tooltipText}>
            <div className={cn(
              "flex flex-1 min-w-0 h-full w-full items-center relative"
            )}
            >
              <input
                ref={inputRef}
                type="text"
                readOnly={false}
                value={isOpen ? inputValue : usage}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  setIsOpen(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isUsageAddOpen) {
                      if (!justSelectedFromListRef.current && !justClearedRef.current) {
                        applySelection(null, inputValue.trim());
                      }
                      justSelectedFromListRef.current = false;
                      justClearedRef.current = false;
                      setIsOpen(false);
                    }
                  }, 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " && !isOpen) {
                    e.preventDefault();
                    setIsOpen(true);
                    setInputValue(usage);
                    return;
                  }
                  handleKeyDown(e);
                }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "m-[1px] flex-1 min-w-0 h-full w-full bg-transparent text-ellipsis overflow-hidden whitespace-nowrap outline-none border-0 ring-0",
                  isOpen ? "cursor-text" : "cursor-pointer",
                  GRID_FONT_SIZE_CLASS[size]
                )}
                placeholder={isOpen ? "검색" : undefined}
                aria-label="용법 선택"
              />
              {isOpen && (inputValue ?? "").trim() !== "" && (
                <button
                  type="button"
                  className="flex-shrink-0 p-[2px] text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="용법 지우기"
                >
                  <XMarkIcon className="w-[14px] h-[14px]" />
                </button>
              )}
            </div>
          </MyTooltip>
        }
        className="flex-1 min-w-0 h-full"
        dropdownClassName="rounded-none"
        maxHeight={202}
        minWidth={300}
      >
        <UsageDropDownContent
          searchFilteredList={searchFilteredList}
          searchKeyword={inputValue.trim()}
          selectedIndex={selectedIndex}
          onSelectItem={handleSelectItem}
          onOpenUsageAdd={() => setIsUsageAddOpen(true)}
        />
      </MyDropDown>

      {/* body에 포털되는 팝업: 드롭다운/부모 레이아웃에 영향 받지 않음 */}
      <MyPopup
        title="용법 추가"
        fitContent={true}
        isOpen={isUsageAddOpen}
        onCloseAction={() => setIsUsageAddOpen(false)}
        localStorageKey="usage-add-popup"
        closeOnOutsideClick={false}
      >
        <UsageAdd
          usage={inputValue}
          allowedCategories={
            allowedCategory ? [allowedCategory] : undefined
          }
          onSuccess={() => {
            setIsUsageAddOpen(false);
            success("등록 완료", "용법이 등록되었습니다.");
          }}
        />
      </MyPopup>
    </>
  );
}

function UsageDropDownContent({
  searchFilteredList,
  searchKeyword,
  selectedIndex,
  onSelectItem,
  onOpenUsageAdd,
}: {
  searchFilteredList: UsageCode[];
  searchKeyword: string;
  selectedIndex: number;
  onSelectItem: (u: UsageCode) => void;
  onOpenUsageAdd: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const itemHeight = 28;

  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-usage-index="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selectedIndex]);

  return (
    <div className="flex flex-col min-h-0">
      <div
        ref={listRef}
        className="flex-1 my-scroll min-h-0"
        style={{ maxHeight: 200 }}
      >
        {searchFilteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-end p-[10px] gap-[4px]">
            <div className="w-full flex flex-row items-center gap-[6px] text-[var(--text-tertiary)]">
              <span className="text-[12px]">검색 결과가 없습니다.</span>
              <span className="text-[10px]">(Enter 입력 시 그대로 반영됩니다.)</span>
            </div>
            <div
              className="w-full flex flex-row items-center gap-[6px]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MyButton
                variant="outline"
                onClick={onOpenUsageAdd}
              >
                새 용법으로 추가
              </MyButton>
              <div className="text-[var(--text-tertiary)] text-[10px]">
                (수정은 기초자료에서 하실 수 있습니다.)
              </div>
            </div>
          </div>
        ) : (
          searchFilteredList.map((item, index) => (
            <div
              key={item.id ?? item.code ?? index}
              data-usage-index={index}
              className={cn(
                "flex items-center gap-2 px-2 cursor-pointer text-[12px] border-b border-transparent",
                index === selectedIndex
                  ? "bg-[var(--bg-tertiary)] font-medium"
                  : "hover:bg-[var(--bg-tertiary)]"
              )}
              style={{ height: itemHeight }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectItem(item);
              }}
            >
              <span className="bg-[var(--blue-1)] flex items-center justify-center rounded-[4px] px-[4px] py-[3px] text-[11px] font-[500] cursor-default leading-none">
                {searchKeyword
                  ? highlightKeyword(item.code ?? "", searchKeyword)
                  : item.code}
              </span>
              <span className="flex-1 truncate">
                {searchKeyword
                  ? highlightKeyword(item.usage ?? "", searchKeyword, {
                    splitWords: true,
                  })
                  : item.usage}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
