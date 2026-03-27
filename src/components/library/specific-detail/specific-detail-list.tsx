import { useEffect, useMemo, useState } from "react";
import MySearchInput from "@/components/yjg/my-search-input";
import {
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import {
  LS_SPECIFIC_DETAIL_HEADERS_KEY,
  defaultSpecificDetailHeaders,
} from "./specific-detail-header";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";
import { convertSpecificDetailCodesToMyGridType } from "./specific-detail-converter";
import { getCellValueAsString } from "@/components/yjg/my-grid/my-grid-util";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";

const PINNED_CODES = new Set(["MX999", "JX999"]);

// 특정내역 탭 컨텐츠
export default function SpecificDetailList({
  specificDetailCodes,
  localSpecificDetails,
  onSelectCode,
  selectedCode,
}: {
  specificDetailCodes: SpecificDetailCode[] | undefined;
  localSpecificDetails: SpecificDetail[];
  onSelectCode: (code: string) => void;
  selectedCode?: string;
}) {
  const [searchWord, setSearchWord] = useState("");
  const [gridHeaders, setGridHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_SPECIFIC_DETAIL_HEADERS_KEY,
      defaultSpecificDetailHeaders
    )
  );

  // code 또는 name으로 필터링 + MX999/JX999 최상단 정렬
  const filteredData = useMemo(() => {
    if (!specificDetailCodes) return [];
    const enrolledCodes = new Set(localSpecificDetails.map((d) => d.code));

    const keyword = searchWord.trim().toLowerCase();
    const source = keyword
      ? specificDetailCodes.filter(
          (item) =>
            item.code.toLowerCase().includes(keyword) ||
            item.name.toLowerCase().includes(keyword)
        )
      : specificDetailCodes;

    const rows = convertSpecificDetailCodesToMyGridType(source, enrolledCodes);

    // MX999, JX999를 최상단으로 정렬
    return rows.sort((a, b) => {
      const aCode = getCellValueAsString(a, "code") ?? "";
      const bCode = getCellValueAsString(b, "code") ?? "";
      const aPin = PINNED_CODES.has(aCode) ? 0 : 1;
      const bPin = PINNED_CODES.has(bCode) ? 0 : 1;
      return aPin - bPin;
    });
  }, [specificDetailCodes, localSpecificDetails, searchWord]);

  // 선택된 코드에 해당하는 grid row
  const selectedGridRows = useMemo(() => {
    if (!selectedCode) return undefined;
    const found = filteredData.find(
      (row) => getCellValueAsString(row, "code") === selectedCode
    );
    return found ? [found] : undefined;
  }, [selectedCode, filteredData]);

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  const handleRowClick = (row: MyGridRowType) => {
    const code = getCellValueAsString(row, "code");
    if (code) {
      onSelectCode(code);
    }
  };

  useEffect(() => {
    saveHeaders(LS_SPECIFIC_DETAIL_HEADERS_KEY, gridHeaders);
  }, [gridHeaders]);

  return (
    <div className="flex flex-col w-full h-full gap-2 py-2 pr-1">
      {/* 검색 입력 */}
      <div className="flex flex-row items-center">
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
        />
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          headers={gridHeaders}
          onHeadersChange={setGridHeaders}
          data={filteredData}
          multiSelect={false}
          size="sm"
          onRowClick={handleRowClick}
          initialSelectedRows={selectedGridRows}
        />
      </div>
    </div>
  );
}
