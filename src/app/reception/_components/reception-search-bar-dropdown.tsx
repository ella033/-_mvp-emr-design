"use client";

import { useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { Patient } from "@/types/patient-types";
import { getAgeOrMonth, getGender } from "@/lib/patient-utils";
import { formatRrnNumber } from "@/lib/common-utils";
import { highlightKeyword } from "@/components/yjg/common/util/ui-util";
import { stripHtmlTags } from "@/utils/template-code-utils";

export type ReceptionSearchBarDropdownPosition = {
  top: number;
  left: number;
  width: number;
};

interface ReceptionSearchBarDropdownProps {
  isOpen: boolean;
  position: ReceptionSearchBarDropdownPosition;
  query: string;
  filteredPatients: Array<Patient & Record<string, any>>;
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  selectedIndex: number;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPatientSelect: (patient: Patient) => void;
  onQuickReception?: (e: React.MouseEvent, patient: Patient) => void;
  onContextMenuOpen: (e: React.MouseEvent, patient: Patient, index: number) => void;
  onSelectedIndexChange: (index: number) => void;
  onDetailedSearch: () => void;
  onNewPatientReception: () => void;
  /** true이면 빠른접수 버튼을 표시하지 않음 (예: 예약 패널) */
  hideQuickReception?: boolean;
}

export function ReceptionSearchBarDropdown({
  isOpen,
  position,
  query,
  filteredPatients,
  isLoading,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  selectedIndex,
  resultsRef,
  onKeyDown,
  onPatientSelect,
  onQuickReception,
  onContextMenuOpen,
  onSelectedIndexChange,
  onDetailedSearch,
  onNewPatientReception,
  hideQuickReception = false,
}: ReceptionSearchBarDropdownProps) {
  if (!isOpen || typeof window === "undefined" || position.width <= 0) {
    return null;
  }

  // throttle을 위한 ref
  const isThrottledRef = useRef(false);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;
      if (isThrottledRef.current) return;
      isThrottledRef.current = true;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 120) {
        onLoadMore();
      }

      setTimeout(() => {
        isThrottledRef.current = false;
      }, 100);
    },
    [hasNextPage, isFetchingNextPage, onLoadMore]
  );

  const dropdownContent = (
    <div
      data-testid="reception-search-dropdown"
      className="fixed bg-white rounded-md shadow-lg z-[999] flex flex-col max-h-[60vh]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {/* 검색 결과 영역 */}
      <div
        ref={resultsRef}
        data-testid="reception-search-results"
        className="overflow-y-auto p-3 flex-1"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[14.75rem]">
            <p className="text-[0.875rem] text-muted-foreground">
              검색 중...
            </p>
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="flex flex-col gap-2">
            <ul>
              {filteredPatients.map((patient: any, index: number) => (
                <li
                  key={patient.id}
                  data-patient-index={index}
                  data-testid="reception-search-result-row"
                  className={`flex flex-col gap-1 p-2 rounded-md cursor-pointer group ${
                    selectedIndex === index
                      ? "bg-[var(--main-color)]/10 border border-[var(--main-color)]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => onPatientSelect(patient)}
                  onContextMenu={(e) => onContextMenuOpen(e, patient, index)}
                  onMouseDown={(e) => e.preventDefault()} // onBlur 이벤트 방지
                  onMouseEnter={() => onSelectedIndexChange(index)}
                >
                  {/* 첫 번째 영역 - 반응형 */}
                  <div className="flex items-start gap-2">
                    {/* 왼쪽: 환자 정보 (줄바꿈 가능) */}
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <span
                        data-testid="reception-search-result-patient-number"
                        className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none whitespace-nowrap"
                      >
                        {highlightKeyword(
                          patient.patientNo.toString() || "",
                          query.toString(),
                          {
                            className:
                              "font-semibold text-black bg-yellow-200 rounded-sm",
                          }
                        )}
                      </span>
                      <span
                        data-testid="reception-search-result-name"
                        className="text-sm text-[var(--gray-200)] font-bold whitespace-nowrap"
                      >
                        {highlightKeyword(patient.name || "", query)}
                      </span>
                      <span className="text-sm text-[var(--gray-200)] font-bold whitespace-nowrap">
                        ({getGender(patient.gender, "ko")}/{getAgeOrMonth(patient.birthDate || "나이", "en")})
                      </span>
                      <span className="text-sm text-[var(--gray-400)] whitespace-nowrap">
                        {highlightKeyword(
                          formatRrnNumber(patient.rrn) || "주민번호 없음",
                          query
                        )}
                      </span>
                      <span className="text-sm text-[var(--gray-400)]">|</span>
                      <span className="text-sm text-[var(--gray-400)] whitespace-nowrap">
                        {highlightKeyword(
                          patient.phone1 || patient.phone || "",
                          query
                        )}
                      </span>
                    </div>
                    {/* 오른쪽: 빠른접수 버튼 (hideQuickReception이 false일 때만 표시) */}
                    {!hideQuickReception && onQuickReception && (
                      <button
                        data-testid="reception-search-result-quick-reception-button"
                        onClick={(e) => onQuickReception(e, patient)}
                        className="flex items-center text-sm text-[var(--main-color)] hover:text-[var(--gray-400)] transition-colors whitespace-nowrap flex-shrink-0"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <img
                          src="/icon/ic_line_quick.svg"
                          alt="빠른접수"
                          className="w-4 h-4"
                        />
                        빠른접수
                      </button>
                    )}
                  </div>
                  {/* 두 번째 영역 - 메모 */}
                  <div className="flex items-start gap-1 truncate">
                    <img
                      src="/note.svg"
                      alt="메모"
                      className="w-3 h-3 mt-0.5 flex-shrink-0"
                    />
                    <span className="text-xs text-[var(--gray-400)] break-words">
                      {highlightKeyword(
                        stripHtmlTags(
                          patient.memo || patient.patientMemo || ""
                        ),
                        query
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {isFetchingNextPage && (
              <div className="py-2 text-center text-xs text-muted-foreground">
                더 불러오는 중...
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col min-h-[14.75rem]">
            <p className="text-[0.75rem]">
              검색결과
            </p>
            <div className="flex flex-1 justify-center items-center">
              <p className="text-[0.875rem] text-muted-foreground">
                이미 등록된 환자는 이름, 생년월일, 전화번호, 환자번호로 검색이 가능합니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer 영역 */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200">
        {/* 좌측: 상세검색 */}
        <div className="flex items-center gap-3">
          <button
            data-testid="reception-detail-search-button"
            onClick={onDetailedSearch}
            onMouseDown={(e) => e.preventDefault()}
            className="text-sm text-[var(--gray-400)] hover:text-[var(--gray-300)] transition-colors"
          >
            상세검색
          </button>
        </div>

        {/* 우측: 신환접수 */}
        <button
          data-testid="reception-dropdown-new-patient-button"
          onClick={onNewPatientReception}
          onMouseDown={(e) => e.preventDefault()}
          className="px-3 py-1 text-sm border rounded transition-colors"
          style={{
            borderColor: "var(--main-color)",
            color: "var(--main-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--main-color)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--main-color)";
          }}
        >
          신환접수
        </button>
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
}
