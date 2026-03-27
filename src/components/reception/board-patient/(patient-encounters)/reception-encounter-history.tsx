"use client";

import { NoneSelectedPatient } from "@/app/medical/_components/widgets/none-patient";
import { useEffect, useState, useRef, useCallback } from "react";
import MySearchInput from "@/components/yjg/my-search-input";
import { MyButton } from "@/components/yjg/my-button";
import { RotateCcwIcon } from "lucide-react";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { MySelect } from "@/components/yjg/my-select";
import {
  청구_OPTIONS,
  보험_OPTIONS,
  초재진_OPTIONS,
} from "@/constants/common/common-option";
import { MyToggleButton } from "@/components/yjg/my-toggle-button";
import EncounterHistoryItem from "@/app/medical/_components/panels/(patient-history)/(encounter-history)/encounter-history-item";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import type { PatientChartQuery } from "@/types/chart/patient-chart-type";
import type { Encounter } from "@/types/chart/encounter-types";
import { usePatientCharts } from "@/hooks/patient/use-patient-charts";
import { useDebounce } from "@/hooks/use-debounce";
import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getInitialHeaders } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { PC_HISTORY_DIAGNOSIS_HEADERS, defaultDiseaseHeaders } from "@/components/disease-order/disease/disease-header";
import { PC_HISTORY_PRESCRIPTION_HEADERS, defaultOrderHeaders } from "@/components/disease-order/order/order-header";
import { useMedicalUi } from "@/app/medical/contexts/medical-ui-context";
import { useEncounterStore } from "@/store/encounter-store";
import type { ExternalReception } from "../types";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export interface ReceptionEncounterHistoryProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
}

const getReceptionPatientId = (reception: ExternalReception | null) => {
  const statusPatientId = reception?.patientStatus?.patient?.id;
  if (typeof statusPatientId === "number" && statusPatientId > 0) {
    return statusPatientId;
  }

  const patientId = reception?.patientBaseInfo?.patientId ?? "";
  const parsed = parseInt(patientId, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function ReceptionEncounterHistory({
  reception,
}: ReceptionEncounterHistoryProps) {
  const receptionPatientId = getReceptionPatientId(reception);
  const [searchParams, setSearchParams] = useState<PatientChartQuery>({
    id: receptionPatientId,
  });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePatientCharts(searchParams);
  const { selectedEncounter, encounters, setEncounters } = useEncounterStore();
  const {
    encounterHistoryFilters,
    setEncounterHistoryFilters,
    resetEncounterHistoryFilters,
  } = useMedicalUi();
  const {
    searchWord,
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

  // 검색 파라미터 업데이트
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      id: receptionPatientId,
    }));
  }, [receptionPatientId]);

  // 필터 변경 감지 (searchParams 변경 시)
  useEffect(() => {
    const prevParams = prevSearchParamsRef.current;
    const currentParams = searchParams;

    // 필터가 변경된 경우 (최초 로드 제외)
    if (
      prevParams !== null &&
      JSON.stringify(prevParams) !== JSON.stringify(currentParams)
    ) {
      // 모든 encounter를 닫힌 상태로 초기화
      setEncounterOpenStates({});
      setIsExpandedAll(false);
    }

    // 이전 searchParams 업데이트
    prevSearchParamsRef.current = currentParams;
  }, [searchParams]);

  useEffect(() => {
    if (data?.pages) {
      const newEncounters =
        data?.pages.flatMap((page: any) => page.encounters) || [];
      setEncounters(newEncounters);

      // 새로운 encounter가 추가되면 기본적으로 닫힌 상태로 초기화
      // 최초 로드 시 가장 최근 encounter는 open 상태로 설정
      setEncounterOpenStates((prev) => {
        const newStates = { ...prev };
        const isInitialLoad = isInitialLoadRef.current;

        // 필터 변경으로 인해 encounterOpenStates가 비어있거나,
        // 완전히 새로운 리스트인 경우 모든 상태를 닫힌 상태로 설정
        const isFilterChanged =
          Object.keys(prev).length === 0 ||
          newEncounters.every((enc: Encounter) => !(enc.id in prev));

        if (isFilterChanged) {
          // 필터 변경으로 완전히 새로운 리스트인 경우 모든 것을 닫힌 상태로
          newEncounters.forEach((encounter: Encounter) => {
            newStates[encounter.id] = false;
          });
          isInitialLoadRef.current = false;
        } else {
          // 기존 로직: 새로운 encounter만 추가 (페이지네이션 등)
          newEncounters.forEach((encounter: Encounter, index: number) => {
            if (!(encounter.id in newStates)) {
              // 최초 로드이고 첫 번째 encounter인 경우 open 상태로 설정
              if (isInitialLoad && index === 0) {
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
    }
  }, [data]);

  // 디바운스된 검색어로 검색 파라미터 업데이트
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      keyword: debouncedSearchWord,
    }));
  }, [debouncedSearchWord]);

  // 청구여부 필터 업데이트
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      isClaim: 청구여부,
    }));
  }, [청구여부]);

  // 보험구분 필터 업데이트
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      insuranceType: 보험구분 ? Number(보험구분) : 0,
    }));
  }, [보험구분]);

  // 초재진구분 필터 업데이트
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      receptionType: 초재진구분 ? Number(초재진구분) : 0,
    }));
  }, [초재진구분]);

  // 처방 필터 업데이트
  useEffect(() => {
    const orderFilters: number[] = [];
    if (isExam === "1") orderFilters.push(2); // 검사
    if (isInjection === "1") orderFilters.push(5); // 주사
    if (isMedication === "1") orderFilters.push(4); // 약물
    //if (isDocument === "1") orderFilters.push(); // 서류
    if (isRadiology === "1") orderFilters.push(3); // 방사선
    if (isPhysicalTreatment === "1") orderFilters.push(7); // 물리치료

    setSearchParams((prev) => ({
      ...prev,
      orderFilters,
    }));
  }, [isExam, isInjection, isMedication, isRadiology, isPhysicalTreatment]);

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
      encounters
        ?.filter((encounter) => encounter.id !== selectedEncounter?.id)
        .forEach((encounter) => {
          newStates[encounter.id] = newIsExpanded;
        });
      return newStates;
    });
  }, [isExpandedAll, encounters]);

  if (!reception) {
    return <NoneSelectedPatient />;
  }

  return (
    <div className="flex flex-col gap-2 pb-2 h-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-row items-center border-y border-[var(--border-1)] p-1">
          <MySearchInput
            value={searchWord}
            onChange={(e) =>
              setEncounterHistoryFilters({ searchWord: e.target.value })
            }
            onClear={() => setEncounterHistoryFilters({ searchWord: "" })}
            placeholder="기록 검색"
            className="border-none rounded-none"
          />
          <div className="flex flex-row items-center">
            {isLoading && <MyLoadingSpinner size="sm" />}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-2 px-2">
          <div className="flex flex-row flex-wrap items-center gap-1">
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
              options={초재진_OPTIONS}
              selectedOption={초재진구분}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 초재진구분: value })
              }
            />
            <EncounterHistoryFilter
              placeholder="청구여부"
              options={청구_OPTIONS}
              selectedOption={청구여부}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 청구여부: value })
              }
            />
            <EncounterHistoryFilter
              placeholder="보험구분"
              options={보험_OPTIONS}
              selectedOption={보험구분}
              setSelectedOption={(value) =>
                setEncounterHistoryFilters({ 보험구분: value })
              }
            />
            <MyDivideLine
              orientation="vertical"
              size="sm"
              className="h-[14px]"
            />
            <MyToggleButton
              size="xs"
              options={[{ value: "1", label: "검", tooltip: "검사" }]}
              value={isExam}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isExam: value })
              }
            />
            <MyToggleButton
              size="xs"
              options={[{ value: "1", label: "주", tooltip: "주사" }]}
              value={isInjection}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isInjection: value })
              }
            />
            <MyToggleButton
              size="xs"
              options={[{ value: "1", label: "약" }]}
              value={isMedication}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isMedication: value })
              }
            />
            <MyToggleButton
              size="xs"
              options={[{ value: "1", label: "방", tooltip: "방사선" }]}
              value={isRadiology}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isRadiology: value })
              }
            />
            <MyToggleButton
              size="xs"
              options={[{ value: "1", label: "물", tooltip: "물리치료" }]}
              value={isPhysicalTreatment}
              onValueChange={(value) =>
                setEncounterHistoryFilters({ isPhysicalTreatment: value })
              }
            />
          </div>
          <div className="flex flex-row flex-wrap items-center gap-1">
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
        encounters={encounters ?? []}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        encounterOpenStates={encounterOpenStates}
        onEncounterToggle={handleEncounterToggle}
        searchKeyword={debouncedSearchWord}
      />
    </div>
  );
}

function EncounterHistoryFilter({
  placeholder,
  options,
  selectedOption,
  setSelectedOption,
}: {
  placeholder: string;
  options: { label: string; value: any }[];
  selectedOption: any;
  setSelectedOption: (option: any) => void;
}) {
  return (
    <MySelect
      size="sm"
      placeholder={placeholder}
      options={[{ label: "전체", value: null }, ...options]}
      value={selectedOption}
      onChange={(value) => setSelectedOption(value)}
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
}: {
  encounters: any[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  encounterOpenStates: Record<string, boolean>;
  onEncounterToggle: (encounterId: string, isOpen: boolean) => void;
  searchKeyword?: string;
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
    getInitialHeaders(
      PC_HISTORY_PRESCRIPTION_HEADERS,
      defaultOrderHeaders
    )
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // 스크롤이 하단에 가까워지면 더 많은 데이터 로드
      if (scrollHeight - scrollTop <= clientHeight + 100) {
        onLoadMore();
      }
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
          isReception
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
