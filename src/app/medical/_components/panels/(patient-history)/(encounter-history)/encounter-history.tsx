import { NoneSelectedPatient } from "../../../widgets/none-patient";
import { useEffect, useState, useRef, useCallback } from "react";
import MySearchInput from "@/components/yjg/my-search-input";
import { MyButton } from "@/components/yjg/my-button";
import { RotateCcwIcon } from "lucide-react";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { MySelect } from "@/components/yjg/my-select";
import {
  청구,
  청구구분Label,
  보험구분상세Label,
  초재진Label,
} from "@/constants/common/common-enum";
import { MyToggleButton } from "@/components/yjg/my-toggle-button";
import EncounterHistoryItem from "./encounter-history-item";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type { PatientChartQuery } from "@/types/chart/patient-chart-type";
import type { Encounter } from "@/types/chart/encounter-types";
import {
  usePatientChartFilter,
  usePatientCharts,
} from "@/hooks/patient/use-patient-charts";
import { useDebounce } from "@/hooks/use-debounce";
import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getInitialHeaders } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { PC_HISTORY_DIAGNOSIS_HEADERS, defaultDiseaseHeaders } from "@/components/disease-order/disease/disease-header";
import { PC_HISTORY_PRESCRIPTION_HEADERS, defaultOrderHeaders } from "@/components/disease-order/order/order-header";
import { useMedicalUi } from "@/app/medical/contexts/medical-ui-context";
import { useReceptionStore } from "@/store/common/reception-store";
import { useEncounterStore } from "@/store/encounter-store";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { SpecificDetailIcon } from "@/components/custom-icons";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import DOMPurify from "dompurify";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { StarIcon } from "@/components/custom-icons";

/** createDateTime이 오늘(로컬 날짜)인지 여부 */
function isCreatedToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

export default function EncounterHistory({
  isReception = false,
  patientIdOverride,
  selectedEncounterIdForAutoOpen = null,
}: {
  isReception?: boolean;
  /** 접수 탭 전용: 공용 reception-store를 세팅하지 않고도 환자 id로 조회할 수 있도록 override */
  patientIdOverride?: number;
  /**접수 탭 전용 : 현재 선택된 encounter를 외부에서 주입할 때 사용 */
  selectedEncounterIdForAutoOpen?: string | null;
}) {
  const { currentRegistration } = useReceptionStore();
  const patientId = patientIdOverride ?? currentRegistration?.patientId ?? 0;
  const [searchParams, setSearchParams] = useState<PatientChartQuery>({
    id: patientId,
  });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePatientCharts(searchParams);
  const { data: chartFilterData, isLoading: isChartFilterLoading } =
    usePatientChartFilter(searchParams.id);
  const { selectedEncounter, encounters: storeEncounters, setEncounters } =
    useEncounterStore();
  const [receptionEncounters, setReceptionEncounters] = useState<Encounter[]>([]);
  const {
    encounterHistoryFilters,
    setEncounterHistoryFilters,
    resetEncounterHistoryFilters,
    expandEncounterIdAfterFiltersReset,
    setExpandEncounterIdAfterFiltersReset,
  } = useMedicalUi();
  const { selectedReception: currentReception } = useSelectedReception();
  const {
    searchWord,
    isFavorite,
    초재진구분,
    청구여부,
    보험구분,
    isExam,
    isInjection,
    isMedication,
    isRadiology,
    isPhysicalTreatment,
  } = encounterHistoryFilters;
  const debouncedSearchWord = useDebounce(searchWord, 500);
  const [encounterOpenStates, setEncounterOpenStates] = useState<
    Record<string, boolean>
  >({});
  const [isExpandedAll, setIsExpandedAll] = useState(false);
  const prevSearchParamsRef = useRef<PatientChartQuery | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  /** data가 실제로 바뀐 경우에만 setEncounters 호출 (삭제 시 selectedEncounter만 바뀌어도 effect가 돌지 않도록) */
  const prevDataRef = useRef<typeof data>(null);

  // 필터/검색어 변경 시 searchParams를 한 번에 반영 (여러 effect가 각각 setSearchParams 하면 서로 덮어써서 필터가 적용되지 않음)
  useEffect(() => {
    const nextPatientId = patientId;
    const orderFilters: number[] = [];
    if (isExam === "1") orderFilters.push(2);
    if (isInjection === "1") orderFilters.push(5);
    if (isMedication === "1") orderFilters.push(4);
    if (isRadiology === "1") orderFilters.push(3);
    if (isPhysicalTreatment === "1") orderFilters.push(7);

    // 보험구분/초재진구분은 0이 유효한 값이므로, null/undefined/'' 일 때만 제외 (truthy 체크 시 0이 필터에서 빠짐)
    const hasInsuranceType = 보험구분 !== null && 보험구분 !== undefined && 보험구분 !== "";
    const hasReceptionType = 초재진구분 !== null && 초재진구분 !== undefined && 초재진구분 !== "";

    setSearchParams({
      id: nextPatientId,
      keyword: debouncedSearchWord || undefined,
      isFavoriteOnly: isFavorite || undefined,
      isClaim: 청구여부 ?? undefined,
      insuranceType: hasInsuranceType ? Number(보험구분) : undefined,
      receptionType: hasReceptionType ? Number(초재진구분) : undefined,
      orderFilters: orderFilters.length > 0 ? orderFilters : undefined,
    });
  }, [
    patientId,
    debouncedSearchWord,
    isFavorite,
    청구여부,
    보험구분,
    초재진구분,
    isExam,
    isInjection,
    isMedication,
    isRadiology,
    isPhysicalTreatment,
  ]);

  // 필터 변경 감지 (searchParams 변경 시)
  useEffect(() => {
    const prevParams = prevSearchParamsRef.current;
    const currentParams = searchParams;

    // 필터가 변경된 경우 (최초 로드 제외)
    if (
      prevParams !== null &&
      JSON.stringify(prevParams) !== JSON.stringify(currentParams)
    ) {
      // 저장 후 필터 리셋으로 인한 변경이면 open 상태 초기화하지 않음 (data effect에서 해당 encounter 열 예정)
      if (!expandEncounterIdAfterFiltersReset) {
        setEncounterOpenStates({});
        setIsExpandedAll(false);
      }
    }

    // 이전 searchParams 업데이트
    prevSearchParamsRef.current = currentParams;
  }, [searchParams, expandEncounterIdAfterFiltersReset]);

  useEffect(() => {
    if (data?.pages) {
      const newEncounters =
        data?.pages.flatMap((page: any) => page.encounters) || [];
      const dataChanged = prevDataRef.current !== data;
      prevDataRef.current = data;
      if (dataChanged) {
        if (isReception) {
          setReceptionEncounters(newEncounters);
        } else {
          setEncounters(newEncounters);
        }
      }

      const expandId = expandEncounterIdAfterFiltersReset;

      // 새로운 encounter가 추가되면 기본적으로 닫힌 상태로 초기화
      // 최초 로드 시 가장 최근 encounter는 open 상태로 설정
      // 단, 가장 최근 encounter가 현재 선택된 encounter라면 그 다음 encounter를 open
      // 저장 후 필터 리셋 시: 지정된 encounter만 열린 상태로 설정
      setEncounterOpenStates((prev) => {
        const newStates = { ...prev };
        const isInitialLoad = isInitialLoadRef.current;

        // 접수 탭: 선택된 encounter는 store가 아니라 props로 받는다.
        const effectiveSelectedEncounterId = isReception
          ? (selectedEncounterIdForAutoOpen ?? selectedEncounter?.id ?? null)
          : selectedEncounter?.id ?? null;

        // 필터 변경으로 인해 encounterOpenStates가 비어있거나,
        // 완전히 새로운 리스트인 경우 모든 상태를 닫힌 상태로 설정
        const isFilterChanged =
          Object.keys(prev).length === 0 ||
          newEncounters.every((enc: Encounter) => !(enc.id in prev));

        // 저장 후 필터 리셋: 지정된 encounter만 열기 (리패치된 목록에 있을 때만 적용하고 플래그 제거)
        const didExpandSavedEncounter =
          expandId &&
          newEncounters.some((enc: Encounter) => enc.id === expandId);
        if (didExpandSavedEncounter) {
          newEncounters.forEach((encounter: Encounter) => {
            newStates[encounter.id] = encounter.id === expandId;
          });
          isInitialLoadRef.current = false;
        } else if (isFilterChanged) {
          // 필터 변경으로 완전히 새로운 리스트인 경우
          const getAutoOpenIndex = (): number => {
            if (newEncounters.length === 0) return -1;

            // 접수실 규칙 (최초 로드):
            // 1) 최초 로드 시 가장 최근 encounter는 open
            // 2) 단, 가장 최근 encounter가 선택된 encounter인 경우 updateDateTime 유무로 open 대상 결정
            if (isReception && isInitialLoad) {
              const newest = newEncounters[0] as Encounter | undefined;
              const newestIsSelected =
                !!effectiveSelectedEncounterId &&
                newest?.id === effectiveSelectedEncounterId;
              if (newestIsSelected) {
                const hasCreateDateTime =
                  typeof newest?.updateDateTime === "string" &&
                  newest.updateDateTime.trim().length > 0;
                return hasCreateDateTime
                  ? 0
                  : newEncounters.length > 1
                    ? 1
                    : -1;
              }
              return 0;
            }

            if (
              effectiveSelectedEncounterId &&
              newEncounters[0]?.id === effectiveSelectedEncounterId
            ) {
              const newest = newEncounters[0];
              if (isReception) {
                const hasUpdateDateTime =
                  typeof (newest as Encounter).updateDateTime === "string" &&
                  ((newest as Encounter).updateDateTime ?? "").trim().length > 0;
                return hasUpdateDateTime
                  ? 0
                  : newEncounters.length > 1
                    ? 1
                    : -1;
              }
              // /medical 기존 동작: 오늘 생성된 차트면 직전 차트를 열고, 아니면 모두 닫음
              if (isCreatedToday((newest as Encounter).encounterDateTime)) {
                return newEncounters.length > 1 ? 1 : -1;
              }
              return -1;
            }
            if (
              effectiveSelectedEncounterId &&
              newEncounters.some(
                (enc: Encounter) => enc.id === effectiveSelectedEncounterId
              )
            ) {
              return 0;
            }
            return -1;
          };
          const autoOpenIndex = getAutoOpenIndex();
          newEncounters.forEach((encounter: Encounter, index: number) => {
            newStates[encounter.id] = index === autoOpenIndex;
          });
          isInitialLoadRef.current = false;
        } else {
          // 기존 로직: 새로운 encounter만 추가 (페이지네이션 등)
          const getAutoOpenIndex = (): number => {
            if (newEncounters.length === 0) return -1;

            // 규칙 (최초 로드):
            // 1) 최초 로드 시 가장 최근 encounter는 open
            // 2) 단, 가장 최근 encounter가 선택된 encounter인 경우 updateDateTime 유무로 open 대상 결정
            if (isReception && isInitialLoad) {
              const newest = newEncounters[0] as Encounter | undefined;
              const newestIsSelected =
                !!effectiveSelectedEncounterId &&
                newest?.id === effectiveSelectedEncounterId;
              if (newestIsSelected) {
                const hasCreateDateTime =
                  typeof newest?.updateDateTime === "string" &&
                  newest.updateDateTime.trim().length > 0;
                return hasCreateDateTime
                  ? 0
                  : newEncounters.length > 1
                    ? 1
                    : -1;
              }
              return 0;
            }

            if (
              effectiveSelectedEncounterId &&
              newEncounters[0]?.id === effectiveSelectedEncounterId
            ) {
              const newest = newEncounters[0];
              if (isReception) {
                const hasCreateDateTime =
                  typeof (newest as Encounter).updateDateTime === "string" &&
                  ((newest as Encounter).updateDateTime ?? "").trim().length > 0;
                return hasCreateDateTime
                  ? 0
                  : newEncounters.length > 1
                    ? 1
                    : -1;
              }
              // /medical 기존 동작: 오늘 생성된 차트면 직전 차트를 열고, 아니면 모두 닫음
              if (isCreatedToday((newest as Encounter).createDateTime)) {
                return newEncounters.length > 1 ? 1 : -1;
              }
              return -1;
            }
            if (
              effectiveSelectedEncounterId &&
              newEncounters.some(
                (enc: Encounter) => enc.id === effectiveSelectedEncounterId
              )
            ) {
              return 0;
            }
            return -1;
          };
          const autoOpenIndex = isInitialLoad ? getAutoOpenIndex() : -1;
          // 접수실 오픈 규칙 : 최초 로드 시에는 prev 상태를 유지하지 않고 전체 open 상태를 재계산한다.
          // (prev에 newest=true가 남아 있으면, 규칙상 index=1을 열어야 하는 케이스에서도 newest가 열린 채로 남을 수 있음)
          if (isReception && isInitialLoad) {
            const freshStates: Record<string, boolean> = {};
            newEncounters.forEach((encounter: Encounter, index: number) => {
              freshStates[encounter.id] = index === autoOpenIndex;
            });
            isInitialLoadRef.current = false;
            return freshStates;
          }

          // /medical 기존 로직 포함: 새로운 encounter만 추가 (페이지네이션 등)
          newEncounters.forEach((encounter: Encounter, index: number) => {
            if (!(encounter.id in newStates)) {
              if (isInitialLoad && index === autoOpenIndex) {
                newStates[encounter.id] = true;
              } else {
                newStates[encounter.id] = false;
              }
            }
          });
          if (isInitialLoad) {
            isInitialLoadRef.current = false;
          }
        }
        return newStates;
      });

      // 저장한 encounter를 실제로 연 경우에만 플래그 제거 (리패치 전에 플래그 지우지 않음)
      if (expandId && newEncounters.some((enc: Encounter) => enc.id === expandId)) {
        setExpandEncounterIdAfterFiltersReset(null);
      }
    }
  }, [
    data,
    selectedEncounter,
    isReception,
    selectedEncounterIdForAutoOpen,
    expandEncounterIdAfterFiltersReset,
    setExpandEncounterIdAfterFiltersReset,
  ]);

  const handleResetFilters = useCallback(() => {
    resetEncounterHistoryFilters();
  }, [resetEncounterHistoryFilters]);

  const handleEncounterToggle = useCallback(
    (encounterId: string, isOpen: boolean) => {
      setEncounterOpenStates((prev) => ({
        ...prev,
        [encounterId]: isOpen,
      }));
    },
    []
  );

  const handleToggleAll = useCallback(() => {
    const newIsExpanded = !isExpandedAll;
    setIsExpandedAll(newIsExpanded);
    setEncounterOpenStates((prev) => {
      const newStates = { ...prev };
      const encounterList = isReception ? receptionEncounters : (storeEncounters ?? []);
      encounterList.forEach((encounter) => {
        newStates[encounter.id] = newIsExpanded;
      });
      return newStates;
    });
  }, [isExpandedAll, isReception, receptionEncounters, storeEncounters]);

  if (!patientId || patientId <= 0) {
    return <NoneSelectedPatient />;
  }

  const encountersForView = isReception ? receptionEncounters : (storeEncounters ?? []);

  return (
    <div className="flex flex-col gap-[6px] pb-[6px] h-full">
      <div className="flex flex-col gap-[6px] w-full">
        <div className="flex flex-row items-center border-y border-[var(--border-1)] p-[3px]">
          <MySearchInput
            value={searchWord}
            onChange={(e) =>
              setEncounterHistoryFilters({ searchWord: e.target.value })
            }
            onClear={() => setEncounterHistoryFilters({ searchWord: "" })}
            placeholder="기록 검색"
            className="border-none rounded-none"
          />
        </div>
        <div className="flex flex-row items-start justify-between px-[6px]">
          <div className="flex flex-row flex-wrap items-center gap-[2px]">
            {!isReception && (
              <>
                <MyButton
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setEncounterHistoryFilters({ isFavorite: !isFavorite })
                  }
                >
                  <StarIcon
                    filled={isFavorite}
                    className={`w-[12px] h-[12px] ${isFavorite ? "text-[var(--second-color)]" : "text-[var(--gray-500)]"}`}
                  />
                </MyButton>
                <MyDivideLine
                  orientation="vertical"
                  size="sm"
                  className="h-[14px]"
                />
              </>
            )}
            <MyTooltip delayDuration={500} content="필터를 초기화합니다.">
              <MyButton
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
              >
                <RotateCcwIcon className="w-[12px] h-[12px]" />
              </MyButton>
            </MyTooltip>
            <EncounterHistoryFilter
              placeholder="초재진구분"
              options={chartFilterData?.receptionTypes.map((type) => ({
                label: 초재진Label[type],
                value: type,
              }))}
              selectedOption={초재진구분}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 초재진구분: value })
              }
              isLoading={isChartFilterLoading}
            />
            <EncounterHistoryFilter
              placeholder="청구여부"
              options={chartFilterData?.isClaimValues.map((isClaim) => ({
                label: 청구구분Label[isClaim ? 청구.청구 : 청구.비청구],
                value: isClaim ? 청구.청구 : 청구.비청구,
              }))}
              selectedOption={청구여부}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 청구여부: value })
              }
              isLoading={isChartFilterLoading}
            />
            <EncounterHistoryFilter
              placeholder="보험구분"
              options={chartFilterData?.insuranceTypes.map((type) => ({
                label:
                  보험구분상세Label[type as keyof typeof 보험구분상세Label],
                value: type,
              }))}
              selectedOption={보험구분}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 보험구분: value })
              }
              isLoading={isChartFilterLoading}
            />
            <MyDivideLine
              orientation="vertical"
              size="sm"
              className="h-[14px]"
            />
            <MyToggleButton
              size="sm"
              options={[{ value: "1", label: "검", tooltip: "검사" }]}
              value={isExam}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isExam: value })
              }
            />
            <MyToggleButton
              size="sm"
              options={[{ value: "1", label: "주", tooltip: "주사" }]}
              value={isInjection}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isInjection: value })
              }
            />
            <MyToggleButton
              size="sm"
              options={[{ value: "1", label: "약" }]}
              value={isMedication}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isMedication: value })
              }
            />
            <MyToggleButton
              size="sm"
              options={[{ value: "1", label: "방", tooltip: "방사선" }]}
              value={isRadiology}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isRadiology: value })
              }
            />
            <MyToggleButton
              size="sm"
              options={[{ value: "1", label: "물", tooltip: "물리치료" }]}
              value={isPhysicalTreatment}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isPhysicalTreatment: value })
              }
            />
          </div>
          <div className="flex flex-row flex-wrap items-center gap-0">
            {isReception && (
              currentReception?.patientBaseInfo?.clinicalMemo ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MyButton
                      variant="ghost"
                      size="icon"
                      className="flex items-center px-2 py-1 font-medium text-[var(--main-color)]"
                    >
                      <SpecificDetailIcon className="w-[12px] h-[12px]" />
                      <span className="text-[11px]">임상정보</span>
                    </MyButton>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    className="!bg-white !text-gray-900 border border-gray-300 rounded-md shadow-lg p-0 w-[300px] h-[350px] !z-[9999]"
                  >
                    <div
                      className="h-full overflow-y-auto p-2 text-xs my-scroll text-gray-900"
                      style={{ userSelect: "text", cursor: "default" }}
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          currentReception.patientBaseInfo.clinicalMemo
                        ),
                      }}
                    />
                  </TooltipContent>
                </Tooltip>
              ) : (
                <MyButton
                  variant="ghost"
                  size="icon"
                  className="flex items-center px-2 py-1 font-medium text-[var(--main-color)]"
                  disabled
                >
                  <SpecificDetailIcon className="w-[12px] h-[12px]" />
                  <span className="text-[11px]">임상정보</span>
                </MyButton>
              )
            )}
            <MyTooltip
              delayDuration={500}
              content={
                isExpandedAll
                  ? "전체 내원이력을 축소합니다."
                  : "전체 내원이력을 확장합니다."
              }
            >
              <MyButton variant="ghost" size="icon" onClick={handleToggleAll}>
                {isExpandedAll ? (
                  <div className="flex flex-row items-center gap-1">
                    <div className="text-[10px] whitespace-nowrap text-[var(--gray-400)]">
                      전체닫기
                    </div>
                    <ChevronUpIcon className="w-[12px] h-[12px]" />
                  </div>
                ) : (
                  <div className="flex flex-row items-center gap-1">
                    <div className="text-[10px] whitespace-nowrap text-[var(--gray-400)]">
                      전체열기
                    </div>
                    <ChevronDownIcon className="w-[12px] h-[12px]" />
                  </div>
                )}
              </MyButton>
            </MyTooltip>
          </div>
        </div>
      </div>
      <EncounterHistoryContent
        encounters={encountersForView}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        encounterOpenStates={encounterOpenStates}
        onEncounterToggle={handleEncounterToggle}
        searchKeyword={debouncedSearchWord}
        isReception={isReception}
      />
    </div>
  );
}

function EncounterHistoryFilter({
  placeholder,
  options,
  selectedOption,
  setSelectedOption,
  isLoading,
}: {
  placeholder: string;
  options?: { label: string; value: any }[];
  selectedOption: any;
  setSelectedOption: (option: any) => void;
  isLoading: boolean;
}) {
  return isLoading || !options ? (
    <MyLoadingSpinner size="sm" />
  ) : (
    <MySelect
      size="sm"
      placeholder={placeholder}
      options={[{ label: "전체", value: null }, ...options]}
      value={selectedOption}
      onChange={(value) => setSelectedOption(value)}
      isAllShowPlaceholder={true}
    />
  );
}

function EncounterHistoryContent({
  encounters,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  encounterOpenStates,
  onEncounterToggle,
  searchKeyword,
  isReception,
}: {
  encounters: any[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  encounterOpenStates: Record<string, boolean>;
  onEncounterToggle: (encounterId: string, isOpen: boolean) => void;
  searchKeyword?: string;
  isReception?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagnosisHeaders, setDiagnosisHeaders] = useState<
    MyTreeGridHeaderType[]
  >(
    getInitialHeaders(PC_HISTORY_DIAGNOSIS_HEADERS, defaultDiseaseHeaders)
  );
  const [prescriptionHeaders, setPrescriptionHeaders] = useState<
    MyTreeGridHeaderType[]
  >(
    getInitialHeaders(PC_HISTORY_PRESCRIPTION_HEADERS, defaultOrderHeaders)
  );

  // throttle을 위한 ref
  const isThrottledRef = useRef(false);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

      // throttle 적용 - 100ms마다 한 번만 실행
      if (isThrottledRef.current) return;
      isThrottledRef.current = true;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // 스크롤이 하단에 가까워지면 더 많은 데이터 로드
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        onLoadMore();
      }

      setTimeout(() => {
        isThrottledRef.current = false;
      }, 100);
    },
    [onLoadMore, hasNextPage, isFetchingNextPage]
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <MyLoadingSpinner size="sm" />
      </div>
    );
  }

  if (!encounters || encounters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">
          내원 기록이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col gap-2 px-2 py-[1px] my-scroll"
      onScroll={handleScroll}
    >
      {encounters.map((encounter: any) => (
        <EncounterHistoryItem
          key={encounter.id}
          encounter={encounter}
          diagnosisHeaders={diagnosisHeaders}
          prescriptionHeaders={prescriptionHeaders}
          setDiagnosisHeaders={setDiagnosisHeaders}
          setPrescriptionHeaders={setPrescriptionHeaders}
          isOpen={encounterOpenStates[encounter.id] ?? false}
          onToggleOpen={(isOpen) => onEncounterToggle(encounter.id, isOpen)}
          searchKeyword={searchKeyword}
          isReception={isReception ?? false}
        />
      ))}

      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="text-[var(--text-secondary)]">로딩 중...</div>
        </div>
      )}
    </div>
  );
}
