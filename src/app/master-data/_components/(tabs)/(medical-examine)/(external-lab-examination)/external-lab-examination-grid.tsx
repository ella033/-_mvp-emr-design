import { useEffect, useRef, useState } from "react";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import MyGrid, { MyGridRef } from "@/components/yjg/my-grid/my-grid";
import { MyGridSettingButton } from "@/components/yjg/my-grid/my-grid-setting-button";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { GridContainer } from "../../../(common)/common-controls";
import { useQuery } from "@tanstack/react-query";
import { ExternalLabService } from "@/services/external-lab-service";
import type {
  ExternalLabExaminationsResponse,
  ExternalLabExamination,
} from "./external-lab-examination-types";
import { convertExternalLabExaminationToGridRowType } from "./external-lab-examination-converter";
import { LS_EXTERNAL_LAB_EXAMINATION_HEADERS_KEY, defaultExternalLabExaminationHeaders } from "../medical-examine-header";
import { MyButton } from "@/components/yjg/my-button";
import { ChevronsUpIcon, ChevronsDownIcon } from "lucide-react";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import MySearchInput from "@/components/yjg/my-search-input";
import { useDebounce } from "@/hooks/use-debounce";

interface ExternalLabExaminationGridProps {
  labId: string;
  externalLabHospitalMappingId?: string;
  onExaminationSelect?: (
    examination: ExternalLabExamination,
    externalLabHospitalMappingId?: string
  ) => void;
}

export default function ExternalLabExaminationGrid({
  labId,
  externalLabHospitalMappingId,
  onExaminationSelect,
}: ExternalLabExaminationGridProps) {
  const [dataMap, setDataMap] = useState<Map<number, MyGridRowType>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      `${LS_EXTERNAL_LAB_EXAMINATION_HEADERS_KEY}-${labId}`,
      defaultExternalLabExaminationHeaders
    )
  );
  const [cursor, setCursor] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchWord, setSearchWord] = useState("");
  const debouncedSearchWord = useDebounce(searchWord, 500); // 500ms 디바운스

  const { data, isLoading, isFetching } =
    useQuery<ExternalLabExaminationsResponse>({
      queryKey: [
        "external-lab-examinations",
        labId,
        cursor,
        debouncedSearchWord,
      ],
      queryFn: async () => {
        return await ExternalLabService.getExaminations(
          labId,
          cursor,
          debouncedSearchWord
        );
      },
      enabled: !!labId,
    });

  // labId가 변경되면 cursor 초기화
  useEffect(() => {
    setCursor(null);
    setAllItems([]);
    setTotalCount(0);
    setSearchWord("");
  }, [labId]);

  // 검색어가 변경되면 cursor 초기화
  useEffect(() => {
    setCursor(null);
    setAllItems([]);
    setTotalCount(0);
  }, [debouncedSearchWord]);

  // 데이터 업데이트
  useEffect(() => {
    if (data) {
      if (cursor === null) {
        // 초기 로드
        setAllItems(data.items);
        setTotalCount(data.totalCount);
      } else {
        // 추가 로드
        setAllItems((prev) => [...prev, ...data.items]);
        // totalCount는 초기 로드 시에만 업데이트
      }
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    }
  }, [data, cursor]);

  useEffect(() => {
    if (allItems.length > 0) {
      const rows = convertExternalLabExaminationToGridRowType(allItems, 0);
      setDataMap(new Map(rows.map((row) => [row.rowIndex, row])));
    } else {
      setDataMap(new Map());
    }
  }, [allItems]);

  const handleLoadMore = () => {
    if (isFetching || !hasNextPage || !nextCursor) return;
    setCursor(nextCursor);
  };

  useEffect(() => {
    saveHeaders(`${LS_EXTERNAL_LAB_EXAMINATION_HEADERS_KEY}-${labId}`, headers);
  }, [headers, labId]);

  const gridRef = useRef<MyGridRef>(null);

  const handleScrollToTop = () => {
    gridRef.current?.scrollToTop();
  };
  const handleScrollToBottom = () => {
    gridRef.current?.scrollToBottom();
  };

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  const handleSelectedRows = (selectedRows: MyGridRowType[]) => {
    if (selectedRows.length !== 1 || !onExaminationSelect) return;
    const examinationId = selectedRows[0]?.key as string;
    if (!examinationId) return;

    // 선택된 검사 데이터 찾기
    const selectedExamination = allItems.find(
      (item) => item.id === examinationId
    );
    if (selectedExamination) {
      onExaminationSelect(selectedExamination, externalLabHospitalMappingId);
    }
  };

  return (
    <GridContainer>
      <div className="flex flex-row w-full items-center gap-2 my-scroll">
        <div className="text-base font-semibold whitespace-nowrap px-3">
          검사 목록
        </div>
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          placeholder="검사명, 검사코드, 청구코드 검색"
        />
        <div className="flex flex-row items-center ps-2">
          {isLoading ? (
            <MyLoadingSpinner size="sm" />
          ) : (
            <div className="text-sm whitespace-nowrap">
              {dataMap.size} / {totalCount}
            </div>
          )}
        </div>
        <div className="flex flex-row items-center">
          <MyTooltip delayDuration={500} content="최상단으로 이동">
            <MyButton onClick={handleScrollToTop} variant="ghost">
              <ChevronsUpIcon className="w-4 h-4" />
            </MyButton>
          </MyTooltip>
          <MyTooltip delayDuration={500} content="최하단으로 이동">
            <MyButton onClick={handleScrollToBottom} variant="ghost">
              <ChevronsDownIcon className="w-4 h-4" />
            </MyButton>
          </MyTooltip>
          <MyGridSettingButton
            defaultHeaders={defaultExternalLabExaminationHeaders}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          ref={gridRef}
          headers={headers}
          data={Array.from(dataMap.values())}
          onHeadersChange={setHeaders}
          multiSelect={false}
          isLoading={isLoading}
          loadingMsg="검사 목록을 불러오는 중입니다..."
          onSelectedRowsChange={handleSelectedRows}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          isLoadingMore={isFetching}
        />
      </div>
    </GridContainer>
  );
}
