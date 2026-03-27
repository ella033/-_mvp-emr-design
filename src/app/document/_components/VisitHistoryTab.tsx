'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Settings2, ChevronDown as ChevronDownIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import InputDate from '@/components/ui/input-date';
import { useDocumentContext } from '../_contexts/DocumentContext';
import { usePatientCharts } from '@/hooks/patient/use-patient-charts';
import { useDebounce } from '@/hooks/use-debounce';
import VisitHistoryItem from './VisitHistoryItem';
import type { Encounter } from '@/types/chart/encounter-types';
import { MyLoadingSpinner } from '@/components/yjg/my-loading-spinner';
import { useToastHelpers } from '@/components/ui/toast';
import {
  처방상세구분,
} from '@/types/master-data/item-type';
import type { PatientChartQuery } from '@/types/chart/patient-chart-type';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type CategoryFilter = 'exam' | 'injection' | 'medication' | 'radiology' | 'physical-treatment';

export default function VisitHistoryTab() {
  const searchParams = useSearchParams();
  const {
    selectedPatient,
    selectedEncounter,
    setSelectedEncounter,
    setAppliedEncounters,
    appliedEncounters,
    selectedFormId,
    formMode,
    setFormMode,
    setLoadedIssuance,
    externalModifiedRef,
  } = useDocumentContext();
  const { error: showErrorToast } = useToastHelpers();
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    return formatDateToYmd(oneMonthAgo);
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<Set<CategoryFilter>>(
    new Set()
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPatientChartQueryKeyRef = useRef<string | null>(null);
  const [isNewIssuanceConfirmOpen, setIsNewIssuanceConfirmOpen] = useState(false);
  const [pendingEncountersToApply, setPendingEncountersToApply] = useState<Encounter[]>([]);

  // URL에서 encounterId 확인
  const encounterIdFromUrl = searchParams?.get('encounterId');

  // 검색 파라미터 설정
  const patientChartQuery = useMemo<PatientChartQuery>(() => {
    const { beginDate, endDate } = buildKstDateRangeQuery(dateFrom, dateTo);
    const orderFilters = buildOrderFiltersByCategories(selectedCategoryFilters);

    return {
      id: selectedPatient?.id ?? 0,
      keyword: debouncedSearchQuery || undefined,
      beginDate,
      endDate,
      orderFilters,
    };
  }, [selectedPatient?.id, debouncedSearchQuery, dateFrom, dateTo, selectedCategoryFilters]);

  // API 호출 - usePatientCharts 사용
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePatientCharts(patientChartQuery);

  // encounters 추출
  const encounters = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: any) => page.encounters || []);
  }, [data]);

  // 서버 필터링 기반 리스트 (정렬만 클라이언트에서 처리)
  const filteredList = useMemo(() => {
    const list: Encounter[] = [...encounters];
    list.sort((a, b) => {
      const dateA = new Date(a.encounterDateTime || '').getTime();
      const dateB = new Date(b.encounterDateTime || '').getTime();
      return dateB - dateA;
    });
    return list;
  }, [encounters]);

  function handleApplyToForm() {
    const selectedEncounters = filteredList.filter((encounter) =>
      selectedItems.has(encounter.id)
    );
    const hasSelectedEncounters = selectedEncounters.length > 0;

    if (!hasSelectedEncounters) {
      showErrorToast('내원이력을 선택해 주세요.');
      return;
    }

    const isViewMode = formMode === 'view';
    if (isViewMode) {
      setPendingEncountersToApply(selectedEncounters);
      setIsNewIssuanceConfirmOpen(true);
      return;
    }

    externalModifiedRef.current = true;
    setAppliedEncounters(selectedEncounters);
    setSelectedEncounter(selectedEncounters[0] ?? null);
  }

  function handleConfirmNewIssuance() {
    setFormMode('edit');
    setLoadedIssuance(null);
    externalModifiedRef.current = true;
    setAppliedEncounters(pendingEncountersToApply);
    setSelectedEncounter(pendingEncountersToApply[0] ?? null);
    setPendingEncountersToApply([]);
    setIsNewIssuanceConfirmOpen(false);
  }

  function handleCancelNewIssuance() {
    setPendingEncountersToApply([]);
    setIsNewIssuanceConfirmOpen(false);
  }


  function toggleExpanded(encounterId: string) {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(encounterId)) {
        newSet.delete(encounterId);
      } else {
        newSet.add(encounterId);
      }
      return newSet;
    });
  }

  function toggleSelected(encounterId: string) {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(encounterId)) {
        newSet.delete(encounterId);
      } else {
        newSet.add(encounterId);
      }
      return newSet;
    });
  }

  const isAllSelected = filteredList.length > 0 && selectedItems.size === filteredList.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredList.map((item) => item.id)));
    }
  }

  // 기간 설정 핸들러
  const setPeriod = (months: number) => {
    const today = new Date();
    const targetDate = new Date();
    targetDate.setMonth(today.getMonth() - months);

    setDateFrom(formatDateToYmd(targetDate));
    setDateTo(formatDateToYmd(today));
  };

  // 전체 닫기
  function closeAll() {
    setExpandedItems(new Set());
  }

  function toggleCategoryFilter(filter: CategoryFilter) {
    setSelectedCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }

  function clearCategoryFilters() {
    setSelectedCategoryFilters(new Set());
  }

  // 서식 변경 시 체크박스/확장 상태 초기화 (appliedEncounters는 DocumentContext에서 리셋됨)
  useEffect(function resetSelectionOnFormChange() {
    setSelectedItems(new Set());
    setExpandedItems(new Set());
  }, [selectedFormId]);

  // 필터 변경 시(서버 쿼리 변경) 선택/확장 상태 초기화
  useEffect(function resetOnQueryChange() {
    const queryKey = JSON.stringify(patientChartQuery);
    const prevKey = prevPatientChartQueryKeyRef.current;
    prevPatientChartQueryKeyRef.current = queryKey;

    const isFirst = prevKey === null;
    const isChanged = prevKey !== null && prevKey !== queryKey;
    if (isFirst || !isChanged) return;

    setSelectedItems(new Set());
    setExpandedItems(new Set());
  }, [patientChartQuery]);

  // 환자 변경 시 내원이력 관련 상태 초기화
  // 단, URL에 encounterId가 있으면 selectedEncounter는 초기화하지 않음 (layout.tsx에서 설정됨)
  useEffect(function resetOnPatientChange() {
    setSelectedItems(new Set());
    setExpandedItems(new Set());
    setSearchQuery('');
    // URL에 encounterId가 없을 때만 selectedEncounter 초기화
    if (!encounterIdFromUrl) {
      setSelectedEncounter(null);
    }
  }, [selectedPatient?.id, setSelectedEncounter, encounterIdFromUrl]);

  // selectedEncounter와 filteredList를 기반으로 자동 선택 및 확장
  // 서식과 환자가 선택된 상태에서 내원이력이 로드되면 최신 내원이력을 자동으로 서식에 적용
  useEffect(function autoSelectAndExpandEncounter() {
    if (filteredList.length === 0) return;

    // selectedEncounter가 있고 filteredList에 해당 항목이 있으면 그것을 확장 및 선택
    if (selectedEncounter) {
      const encounterInList = filteredList.find((item) => item.id === selectedEncounter.id);
      if (encounterInList) {
        setExpandedItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(selectedEncounter.id);
          return newSet;
        });
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(selectedEncounter.id);
          return newSet;
        });
        return; // selectedEncounter가 있으면 첫 번째 항목 확장하지 않음
      }
    }

    // selectedEncounter가 없거나 filteredList에 없으면 첫 번째 항목 처리
    const firstItem = filteredList[0];
    if (firstItem) {
      const firstItemId = firstItem.id;
      
      // 첫 번째 항목 확장
      setExpandedItems((prev) => {
        if (prev.has(firstItemId)) {
          return prev;
        }
        const newSet = new Set(prev);
        newSet.add(firstItemId);
        return newSet;
      });

      // 자동 적용 조건 확인:
      // 1. 서식이 선택되어 있음
      // 2. 아직 적용된 encounters가 없음
      // 3. view 모드가 아님 (발급이력 조회 중이 아님)
      // 4. URL에서 온 encounterId가 없음
      const shouldAutoApply =
        selectedFormId !== null &&
        appliedEncounters.length === 0 &&
        formMode !== 'view' &&
        !encounterIdFromUrl;

      if (shouldAutoApply) {
        // 첫 번째 항목 선택(체크)
        setSelectedItems((prev) => {
          if (prev.has(firstItemId)) {
            return prev;
          }
          const newSet = new Set(prev);
          newSet.add(firstItemId);
          return newSet;
        });

        // 서식에 자동 적용
        setAppliedEncounters([firstItem]);
        setSelectedEncounter(firstItem);
      }
    }
  }, [
    filteredList,
    selectedEncounter,
    selectedFormId,
    appliedEncounters.length,
    formMode,
    encounterIdFromUrl,
    setAppliedEncounters,
    setSelectedEncounter,
  ]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const isLoadMoreAvailable = Boolean(hasNextPage && !isFetchingNextPage);
      if (!isLoadMoreAvailable) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + 100;
      if (!isNearBottom) return;

      fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* 상단 필터 영역 */}
      <div className="flex flex-col gap-[8px] p-[12px]">
        {/* 검색창 */}
        <div className="relative h-[32px]">
          <div className="absolute left-[8px] top-1/2 -translate-y-1/2 text-[#c2c4c8]">
            <Search size={16} />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="내원이력"
            className="h-full pl-[30px] pr-[30px] text-[14px] border-[#c2c4c8]"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              aria-label="검색어 지우기"
              className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#989ba2] hover:text-[#46474c]"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 날짜 선택 */}
        <div className="flex items-center gap-[12px]">
          <div className="flex items-center gap-[6px] flex-1">
            <InputDate
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="YYYY-MM-DD"
              className="h-[32px] text-[13px] px-[8px] text-center"
              wrapperClassName="flex-1"
            />
            <span className="text-[#989ba2] text-[13px]">-</span>
            <InputDate
              value={dateTo}
              onChange={setDateTo}
              placeholder="YYYY-MM-DD"
              className="h-[32px] text-[13px] px-[8px] text-center"
              wrapperClassName="flex-1"
            />
          </div>
          <div className="flex gap-[4px]">
            {[1, 3, 6].map((month) => (
              <button
                key={month}
                onClick={() => setPeriod(month)}
                className="min-w-[50px] h-[32px] px-[8px] bg-white border border-[#dbdcdf] rounded-[4px] text-[13px] text-[#171719] font-medium hover:bg-gray-50 cursor-pointer"
              >
                {month}개월
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-[6px]">
          <button className="h-[24px] w-[24px] bg-[#eaebec] rounded-[4px] flex items-center justify-center p-[4px] cursor-pointer">
            <Settings2 size={16} className="text-[#46474c]" />
          </button>
          <div className="h-[16px] w-px bg-[#dbdcdf]" />
          <div className="flex items-center gap-[4px] flex-1">
            <button
              onClick={clearCategoryFilters}
              className={`h-[24px] px-[4px] border rounded-[4px] text-[12px] font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap ${selectedCategoryFilters.size === 0
                ? 'bg-white border-[#dbdcdf] text-[#171719]'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              전체
            </button>
            <button
              onClick={() => toggleCategoryFilter('exam')}
              className={`h-[24px] w-[24px] border rounded-[4px] text-[12px] transition-all cursor-pointer ${selectedCategoryFilters.has('exam')
                ? 'bg-white border-[#dbdcdf] text-[#171719] font-medium'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              검
            </button>
            <button
              onClick={() => toggleCategoryFilter('injection')}
              className={`h-[24px] w-[24px] border rounded-[4px] text-[12px] transition-all cursor-pointer ${selectedCategoryFilters.has('injection')
                ? 'bg-white border-[#dbdcdf] text-[#171719] font-medium'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              주
            </button>
            <button
              onClick={() => toggleCategoryFilter('medication')}
              className={`h-[24px] w-[24px] border rounded-[4px] text-[12px] transition-all cursor-pointer ${selectedCategoryFilters.has('medication')
                ? 'bg-white border-[#dbdcdf] text-[#171719] font-medium'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              약
            </button>
            <button
              onClick={() => toggleCategoryFilter('radiology')}
              className={`h-[24px] w-[24px] border rounded-[4px] text-[12px] transition-all cursor-pointer ${selectedCategoryFilters.has('radiology')
                ? 'bg-white border-[#dbdcdf] text-[#171719] font-medium'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              방
            </button>
            <button
              onClick={() => toggleCategoryFilter('physical-treatment')}
              className={`h-[24px] w-[24px] border rounded-[4px] text-[12px] transition-all cursor-pointer ${selectedCategoryFilters.has('physical-treatment')
                ? 'bg-white border-[#dbdcdf] text-[#171719] font-medium'
                : 'bg-white border-[#dbdcdf] text-[#c2c4c8]'
                }`}
            >
              물
            </button>
          </div>
          <button
            onClick={closeAll}
            className="flex items-center gap-[2px] text-[13px] text-[#70737c] hover:text-[#46474c] cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span>전체닫기</span>
            <ChevronDownIcon size={16} />
          </button>
        </div>
      </div>

      {/* 내원이력 리스트 영역 */}
      <div className="flex-1 overflow-hidden p-[12px] flex flex-col">
        <div className="border border-[#eaebec] rounded-[6px] flex flex-col overflow-hidden">
          {/* 필터 영역 */}
          <div className="flex items-center justify-between gap-[8px] px-[12px] py-[4px] border-b border-[#eaebec]">
            <div className="flex items-center gap-[6px]">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <label
                htmlFor="select-all"
                className="text-[13px] text-[#0b0b0b] cursor-pointer shrink-0 whitespace-nowrap"
                onClick={toggleSelectAll}
              >
                전체 선택
              </label>
            </div>
            <div className="flex gap-[4px]">
              <button
                type="button"
                onClick={handleApplyToForm}
                className="h-[24px] px-[8px] bg-white border border-[#180f38] rounded-[4px] text-[13px] text-[#0b0b0b] font-medium hover:bg-gray-50 cursor-pointer shrink-0 whitespace-nowrap"
              >
                서식에 적용
              </button>
            </div>
          </div>
          {/* 내원이력 아이템 리스트 */}
          <div className="flex flex-col gap-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <MyLoadingSpinner size="sm" />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#989ba2] text-[13px] min-h-[200px]">
                {!selectedPatient
                  ? '환자를 선택해주세요.'
                  : '데이터가 없습니다.'}
              </div>
            ) : (
              filteredList.map((encounter) => {
                const isExpanded = expandedItems.has(encounter.id);
                const isSelected = selectedItems.has(encounter.id);

                return (
                  <VisitHistoryItem
                    key={encounter.id}
                    encounter={encounter}
                    isOpen={isExpanded}
                    onToggleOpen={() => toggleExpanded(encounter.id)}
                    isSelected={isSelected}
                    onToggleSelected={() => toggleSelected(encounter.id)}
                    searchKeyword={debouncedSearchQuery}
                  />
                );
              })
            )}

            {isFetchingNextPage && (
              <div className="flex flex-col items-center justify-center py-3">
                <MyLoadingSpinner size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 신규 발급 전환 확인 팝업 */}
      <AlertDialog
        open={isNewIssuanceConfirmOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelNewIssuance();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>신규 발급으로 전환</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-[#46474c]">
              현재 발급 이력 조회 중입니다.
              <br />
              새로운 내원이력을 적용하면 신규 발급으로 전환됩니다.
              <br />
              <br />
              계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNewIssuance}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNewIssuance}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function buildOrderFiltersByCategories(
  selectedCategoryFilters: Set<CategoryFilter>
): number[] | undefined {
  if (selectedCategoryFilters.size === 0) return undefined;

  const orderFilters = new Set<number>();
  selectedCategoryFilters.forEach((filter) => {
    switch (filter) {
      case 'exam':
        orderFilters.add(처방상세구분.검사);
        return;
      case 'injection':
        orderFilters.add(처방상세구분.주사);
        return;
      case 'medication':
        orderFilters.add(처방상세구분.약);
        return;
      case 'radiology':
        orderFilters.add(처방상세구분.방사선);
        return;
      case 'physical-treatment':
        orderFilters.add(처방상세구분.물리치료);
        return;
      default:
        return;
    }
  });

  return Array.from(orderFilters).sort((a, b) => a - b);
}

function buildKstDateRangeQuery(
  dateFrom: string,
  dateTo: string
): { beginDate?: string; endDate?: string } {
  if (!dateFrom || !dateTo) return {};

  const beginDate = new Date(`${dateFrom}T00:00:00+09:00`).toISOString();
  const endDate = new Date(`${dateTo}T23:59:59+09:00`).toISOString();

  return { beginDate, endDate };
}

function formatDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

