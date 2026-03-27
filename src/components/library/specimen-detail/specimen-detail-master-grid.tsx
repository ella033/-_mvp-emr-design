import { useEffect, useState } from "react";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { useDebounce } from "@/hooks/use-debounce";
import MySearchInput from "@/components/yjg/my-search-input";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getCellValueAsString,
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import {
  LS_SPECIMEN_DETAIL_HEADERS_MASTER_KEY,
  defaultSpecimenDetailMasterHeaders,
} from "./specimen-detail-header";
import { convertSpecimenLibrariesToGridRowType } from "./specimen-detail-converter";
import { useSpecimenLibraries } from "@/hooks/specimen-libraries/use-specimen-libraries";
import { MyButton } from "@/components/yjg/my-button";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";

interface SpecimenDetailMasterGridProps {
  localSpecimen: SpecimenDetail[];
  setLocalSpecimen: (specimen: SpecimenDetail[]) => void;
}

export default function SpecimenDetailMasterGrid({
  localSpecimen,
  setLocalSpecimen,
}: SpecimenDetailMasterGridProps) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_SPECIMEN_DETAIL_HEADERS_MASTER_KEY,
      defaultSpecimenDetailMasterHeaders
    )
  );
  const [rows, setRows] = useState<MyGridRowType[]>([]);
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);
  const [searchWord, setSearchWord] = useState("");
  const debouncedSearchWord = useDebounce(searchWord, 500);
  const { data, isLoading } = useSpecimenLibraries(debouncedSearchWord);

  useEffect(() => {
    setRows(convertSpecimenLibrariesToGridRowType(data ?? [], 0));
  }, [data]);

  // 외부 클릭 시 선택 해제 (버튼 제외)
  const handleContainerClick = (e: React.MouseEvent) => {
    // 버튼이나 그리드 내부 클릭인지 확인
    const target = e.target as Element;
    if (target.closest("button") || target.closest(".my-grid")) {
      return; // 버튼이나 그리드 내부 클릭은 무시
    }
    setSelectedRows([]);
  };

  const handleSelectedRows = (
    selectedRows: MyGridRowType[],
    isClickOutside?: boolean
  ) => {
    if (isClickOutside) {
      return;
    }
    setSelectedRows(selectedRows);
  };

  const enrollSpecimen = (rows: MyGridRowType[]) => {
    const specimen: SpecimenDetail[] = rows.map((row) => ({
      id: row.key as number,
      code: getCellValueAsString(row, "code") ?? "",
      name: getCellValueAsString(row, "name") ?? "",
    }));

    const existingIds = localSpecimen.map((item) => item.id);
    const filteredSpecimen = specimen.filter(
      (item) => !existingIds.includes(item.id)
    );

    setLocalSpecimen([...localSpecimen, ...filteredSpecimen]);
    setSelectedRows([]);
  };

  const handleRowDoubleClick = (
    _headerKey: string,
    row: MyGridRowType,
    _event: React.MouseEvent
  ) => {
    enrollSpecimen([row]);
  };

  const handleRegister = () => {
    enrollSpecimen(selectedRows);
  };

  useEffect(() => {
    saveHeaders(LS_SPECIMEN_DETAIL_HEADERS_MASTER_KEY, headers);
  }, [headers]);

  return (
    <div
      className="flex flex-col w-full h-full p-2 gap-2"
      onClick={handleContainerClick}
    >
      <div className="flex flex-row w-full items-center gap-2">
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
        {isLoading && <MyLoadingSpinner size="sm" />}
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden my-grid">
        <MyGrid
          headers={headers}
          onHeadersChange={setHeaders}
          data={rows}
          isLoading={isLoading}
          loadingMsg="검체 라이브러리를 불러오는 중입니다..."
          onSelectedRowsChange={handleSelectedRows}
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
              ? "상단에서 검체를 선택해주세요"
              : `선택된 ${selectedRows.length}개 검체 등록`}
          </MyButton>
        </div>
      </div>
    </div>
  );
}
