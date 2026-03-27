import MyGrid from "@/components/yjg/my-grid/my-grid";
import { MyGridSettingButton } from "@/components/yjg/my-grid/my-grid-setting-button";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import MySearchInput from "@/components/yjg/my-search-input";
import { useEffect, useRef, useState } from "react";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  LS_DISEASE_LINK_HEADERS_MASTER_KEY,
  defaultDiseaseLinkMasterHeaders,
} from "./disease-link-header";
import {
  getCellValueAsString,
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import { useSearchDiseaseLibraries } from "@/hooks/disease-library/use-search-disease-libraries";
import { formatDate } from "@/lib/date-utils";
import { convertDiseaseLibrariesToGridRowType } from "./disease-link-converter";
import { MyButton } from "@/components/yjg/my-button";
import { MyGridRef } from "@/components/yjg/my-grid/my-grid";
import { ChevronsDownIcon, ChevronsUpIcon } from "lucide-react";
import type { DiseaseLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";

interface DiseaseLinkMasterGridProps {
  localDiseaseLink: DiseaseLinkType[];
  setLocalDiseaseLink: (diseaseLink: DiseaseLinkType[]) => void;
}

export default function DiseaseLinkMasterGrid({
  localDiseaseLink,
  setLocalDiseaseLink,
}: DiseaseLinkMasterGridProps) {
  const [searchWord, setSearchWord] = useState("");
  const debouncedSearchWord = useDebounce(searchWord, 500);
  const [dataMap, setDataMap] = useState<Map<number, MyGridRowType>>(new Map());
  const [totalCount, setTotalCount] = useState(0);
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_DISEASE_LINK_HEADERS_MASTER_KEY,
      defaultDiseaseLinkMasterHeaders
    )
  );
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchDiseaseLibraries({
      keyword: debouncedSearchWord || undefined, // 빈 문자열을 undefined로 변환
      limit: 200,
      baseDate: formatDate(new Date(), "-"),
      isComplete: true,
    });

  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);

  // 디바운스된 검색어가 변경되면 데이터 맵 초기화
  useEffect(() => {
    setDataMap(new Map());
  }, [debouncedSearchWord]);

  // 모든 페이지의 데이터를 dataMap에 병합
  useEffect(() => {
    if (data?.pages) {
      const allRows: MyGridRowType[] = [];
      let rowIndex = 0;

      data.pages.forEach((page) => {
        const newRows = convertDiseaseLibrariesToGridRowType(
          page.items,
          rowIndex
        );
        newRows.forEach((row) => {
          allRows.push({
            ...row,
            rowIndex: rowIndex++,
          });
        });
      });

      setDataMap(new Map(allRows.map((row) => [row.rowIndex, row])));
      setTotalCount(data.pages[0]?.totalCount ?? 0);
    }
  }, [data]);

  const handleSelectedRows = (
    selectedRows: MyGridRowType[],
    isClickOutside?: boolean
  ) => {
    if (isClickOutside) {
      return;
    }
    setSelectedRows(selectedRows);
  };

  const enrollDiseaseLink = (rows: MyGridRowType[]) => {
    const diseaseLink: DiseaseLinkType[] = rows.map((row) => ({
      id: row.key as number,
      code: getCellValueAsString(row, "code") ?? "",
      name: getCellValueAsString(row, "name") ?? "",
    }));

    const existingIds = localDiseaseLink.map((item) => item.id);
    const filteredDisease = diseaseLink.filter(
      (item) => !existingIds.includes(item.id)
    );

    setLocalDiseaseLink([...localDiseaseLink, ...filteredDisease]);
    setSelectedRows([]);
  };

  const handleRowDoubleClick = (
    _headerKey: string,
    row: MyGridRowType,
    _event: React.MouseEvent
  ) => {
    enrollDiseaseLink([row]);
  };

  const handleRegister = () => {
    enrollDiseaseLink(selectedRows);
  };

  const handleLoadMore = () => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  };

  useEffect(() => {
    saveHeaders(LS_DISEASE_LINK_HEADERS_MASTER_KEY, headers);
  }, [headers]);

  const gridRef = useRef<MyGridRef>(null);

  const handleScrollToTop = () => {
    gridRef.current?.scrollToTop();
  };

  const handleScrollToBottom = () => {
    gridRef.current?.scrollToBottom();
  };

  // 외부 클릭 시 선택 해제 (버튼 제외)
  const handleContainerClick = (e: React.MouseEvent) => {
    // 버튼이나 그리드 내부 클릭인지 확인
    const target = e.target as Element;
    if (target.closest("button") || target.closest(".my-grid")) {
      return; // 버튼이나 그리드 내부 클릭은 무시
    }
    setSelectedRows([]);
  };

  return (
    <div
      className="flex flex-col w-full h-full p-2 gap-2"
      onClick={handleContainerClick}
    >
      <div className="flex flex-row w-full items-center gap-2 my-scroll">
        <MySearchInput
          value={searchWord}
          onChange={(e) => {
            const value = e.target.value;
            setSearchWord(value);
          }}
          onClear={() => {
            setSearchWord("");
          }}
        />
        {isLoading ? (
          <MyLoadingSpinner size="sm" />
        ) : (
          <div className="text-sm whitespace-nowrap ps-2">
            {dataMap.size} / {totalCount}
          </div>
        )}

        <div className="flex items-center">
          <MyButton onClick={handleScrollToTop} variant="ghost">
            <ChevronsUpIcon className="w-4 h-4" />
          </MyButton>
          <MyButton onClick={handleScrollToBottom} variant="ghost">
            <ChevronsDownIcon className="w-4 h-4" />
          </MyButton>
          <MyGridSettingButton
            defaultHeaders={defaultDiseaseLinkMasterHeaders}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden my-grid">
        <MyGrid
          ref={gridRef}
          headers={headers}
          onHeadersChange={setHeaders}
          data={Array.from(dataMap.values())}
          isLoading={isLoading}
          loadingMsg="상병 라이브러리를 불러오는 중입니다..."
          onSelectedRowsChange={handleSelectedRows}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </div>
      <div className="flex flex-row w-full items-center justify-end gap-3">
        <div className="flex flex-row items-center gap-2">
          <span className="text-[12px] text-[var(--gray-400)]">
            (Ctrl or Shift) + Click 다중선택하여 추가하거나 더블클릭하여 추가할
            수 있습니다.
          </span>
          <MyButton
            disabled={selectedRows.length === 0}
            onClick={handleRegister}
          >
            {selectedRows.length === 0
              ? "상단에서 상병을 선택해주세요"
              : `선택된 ${selectedRows.length}개 상병 연결코드로 등록`}
          </MyButton>
        </div>
      </div>
    </div>
  );
}
