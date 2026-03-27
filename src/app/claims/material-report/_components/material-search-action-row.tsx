"use client";

import { useCallback, useRef, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import MaterialSearchDropDown from "./material-search-drop-down";
import { useMaterialSearch } from "@/hooks/claims/use-material-report";
import type { MaterialSearchItem } from "@/types/claims/material-report";
import MaterialSearchResultItem from "./material-search-result-item";
import { cn } from "@/lib/utils";

type MaterialSearchActionRowProps = {
  onAddItem: (item: MaterialSearchItem) => void;
  isSentReport: boolean;
};

const SEARCH_RESULT_ITEM_HEIGHT = 28;
const SEARCH_RESULT_MAX_HEIGHT = SEARCH_RESULT_ITEM_HEIGHT * 6;
/** 품명~사업자등록번호: 11개 컬럼 */
const NAME_COLSPAN = 11;

const searchResultHeader = (
  <div className="grid grid-cols-[28px_90px_90px_300px_72px] items-center h-7 text-[12px] font-medium text-[var(--gray-200)] bg-[var(--bg-base)] px-0 rounded-t-[6px]">
    <span />
    <span className="text-center">사용자코드</span>
    <span className="text-center">청구코드</span>
    <span className="pl-2">명칭</span>
    <span className="text-right pr-2">단가</span>
  </div>
);

export default function MaterialSearchActionRow({
  onAddItem,
  isSentReport,
}: MaterialSearchActionRowProps) {
  const actionRowRef = useRef<HTMLTableRowElement>(null);
  const claimCodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 청구코드 검색 상태
  const [claimCodeKeyword, setClaimCodeKeyword] = useState("");
  const [showClaimCodeResults, setShowClaimCodeResults] = useState(false);
  const [isClaimCodeFocused, setIsClaimCodeFocused] = useState(false);

  // 명칭 검색 상태
  const [nameKeyword, setNameKeyword] = useState("");
  const [showNameResults, setShowNameResults] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  // 각각 독립적인 검색 실행
  const { data: claimCodeResults = [] } = useMaterialSearch(claimCodeKeyword);
  const { data: nameResults = [] } = useMaterialSearch(nameKeyword);

  // 청구코드 검색 핸들러
  const handleClaimCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setClaimCodeKeyword(e.target.value);
    },
    []
  );

  const handleClaimCodeClear = useCallback(() => {
    setClaimCodeKeyword("");
    setShowClaimCodeResults(false);
  }, []);

  const handleClaimCodeSelect = useCallback(
    (item: MaterialSearchItem) => {
      onAddItem(item);
      setClaimCodeKeyword("");
      setShowClaimCodeResults(false);
      setIsClaimCodeFocused(false);
    },
    [onAddItem]
  );

  // 명칭 검색 핸들러
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNameKeyword(e.target.value);
    },
    []
  );

  const handleNameClear = useCallback(() => {
    setNameKeyword("");
    setShowNameResults(false);
  }, []);

  const handleNameSelect = useCallback(
    (item: MaterialSearchItem) => {
      onAddItem(item);
      setNameKeyword("");
      setShowNameResults(false);
      setIsNameFocused(false);
    },
    [onAddItem]
  );

  // 청구코드 필드 포커스
  const handleClaimCodeFocus = useCallback(() => {
    setIsClaimCodeFocused(true);
  }, []);

  const handleClaimCodeBlur = useCallback(() => {
    setIsClaimCodeFocused(false);
  }, []);

  // 명칭 필드 포커스
  const handleNameFocus = useCallback(() => {
    setIsNameFocused(true);
  }, []);

  const handleNameBlur = useCallback(() => {
    setIsNameFocused(false);
  }, []);

  const handleClaimCodeCellClick = useCallback(() => {
    claimCodeInputRef.current?.focus();
  }, []);

  const handleNameCellClick = useCallback(() => {
    nameInputRef.current?.focus();
  }, []);

  if (isSentReport) return null;

  const isClaimCodeActive = isClaimCodeFocused || showClaimCodeResults;
  const isNameActive = isNameFocused || showNameResults;

  return (
    <TableRow
      ref={actionRowRef}
      className="bg-[var(--bg-base1)] hover:bg-[var(--bg-base1)]"
      style={{
        borderTop: '1px solid var(--violet-1)'
      }}
    >
      {/* Cell 1: 아이콘 (체크박스 컬럼 위치) */}
      <TableCell className="p-0 bg-[var(--blue-1)]" style={{ width: '28px', minWidth: '28px', maxWidth: '28px', height: '28px' }}>
        <div className="flex items-center justify-center h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon/ic_line_treatment.svg"
            alt=""
            className="w-5 h-5"
            style={{ width: '20px', height: '20px' }}
          />
        </div>
      </TableCell>

      {/* Cell 2: 빈 칸 (줄번호 컬럼 위치) */}
      <TableCell className="w-[60px] px-2 py-0" />

      {/* Cell 3: 청구코드 검색 입력 */}
      <TableCell
        className={cn("w-[100px] max-w-[100px] px-2 py-0 cursor-text rounded-none", {
          "bg-white": isClaimCodeActive,
          "bg-transparent": !isClaimCodeActive,
        })}
        style={isClaimCodeActive ? { outline: '1px solid var(--main-color)', outlineOffset: '-1px' } : undefined}
        onClick={handleClaimCodeCellClick}
      >
        <MaterialSearchDropDown
          value={claimCodeKeyword}
          onChange={handleClaimCodeChange}
          onClear={handleClaimCodeClear}
          onSelect={handleClaimCodeSelect}
          onFocus={handleClaimCodeFocus}
          onBlur={handleClaimCodeBlur}
          inputRef={claimCodeInputRef}
          results={claimCodeResults}
          showResults={showClaimCodeResults}
          onShowResultsChange={setShowClaimCodeResults}
          renderResultItem={(item: MaterialSearchItem) => (
            <MaterialSearchResultItem
              item={item}
              searchWord={claimCodeKeyword}
            />
          )}
          hideClearButton={claimCodeKeyword.length === 0}
          placeholder={isClaimCodeActive ? "" : "청구코드"}
          isLoading={false}
          itemHeight={SEARCH_RESULT_ITEM_HEIGHT}
          maxHeight={SEARCH_RESULT_MAX_HEIGHT}
          parentRef={actionRowRef}
          headerNode={searchResultHeader}
          className="h-7"
          inputClassName={
            isClaimCodeActive
              ? "text-[13px] text-[var(--gray-300)] focus:outline-none focus:ring-0 focus:border-transparent"
              : "text-[13px] text-[var(--gray-300)] placeholder:text-[var(--gray-300)] cursor-text focus:outline-none focus:ring-0 focus:border-transparent"
          }
          inputSize="sm"
          debounceMs={200}
        />
      </TableCell>

      {/* Cell 4: 명칭 검색 입력 (품명~마지막까지) */}
      <TableCell
        colSpan={NAME_COLSPAN}
        className={cn("px-2 py-0 cursor-text rounded-none", {
          "bg-white": isNameActive,
          "bg-transparent": !isNameActive,
        })}
        style={isNameActive ? { outline: '1px solid var(--main-color)', outlineOffset: '-1px' } : undefined}
        onClick={handleNameCellClick}
      >
        <MaterialSearchDropDown
          value={nameKeyword}
          onChange={handleNameChange}
          onClear={handleNameClear}
          onSelect={handleNameSelect}
          onFocus={handleNameFocus}
          onBlur={handleNameBlur}
          inputRef={nameInputRef}
          results={nameResults}
          showResults={showNameResults}
          onShowResultsChange={setShowNameResults}
          renderResultItem={(item: MaterialSearchItem) => (
            <MaterialSearchResultItem
              item={item}
              searchWord={nameKeyword}
            />
          )}
          hideClearButton={nameKeyword.length === 0}
          placeholder={isNameActive ? "" : "명칭"}
          isLoading={false}
          itemHeight={SEARCH_RESULT_ITEM_HEIGHT}
          maxHeight={SEARCH_RESULT_MAX_HEIGHT}
          parentRef={actionRowRef}
          headerNode={searchResultHeader}
          className="h-7"
          inputClassName={
            isNameActive
              ? "text-[13px] text-[var(--gray-300)] focus:outline-none focus:ring-0 focus:border-transparent"
              : "text-[13px] text-[var(--gray-300)] placeholder:text-[var(--gray-300)] cursor-text focus:outline-none focus:ring-0 focus:border-transparent"
          }
          inputSize="sm"
          debounceMs={200}
        />
      </TableCell>
    </TableRow>
  );
}
