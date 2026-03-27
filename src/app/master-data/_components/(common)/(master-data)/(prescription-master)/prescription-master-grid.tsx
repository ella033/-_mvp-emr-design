import { formatDate } from "@/lib/date-utils";
import {
  PrescriptionType,
  PrescriptionSubType,
} from "@/constants/master-data-enum";
import type { PrescriptionLibrariesParamType } from "@/types/master-data/prescription-libraries/prescription-libraries-param-type";
import { useEffect, useRef, useState } from "react";
import { useSearchPrescriptionLibraries } from "@/hooks/master-data/use-prescription-libraries";
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
import MySearchInput from "@/components/yjg/my-search-input";
import { PrescriptionMasterFilter } from "./prescription-master-filter";
import { useDebounce } from "@/hooks/use-debounce";
import { getMasterDataTitle } from "@/lib/master-data-utils";
import {
  ITEM_TYPE_OPTIONS,
  ITEM_TYPE_ACTION_OPTIONS,
  ITEM_TYPE_EXAMINE_OPTIONS,
  ITEM_TYPE_MATERIAL_OPTIONS,
} from "@/constants/library-option/item-type-option";
import { ADMINISTRATION_ROUTE_OPTIONS } from "@/constants/library-option/administration-route-option";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import { GridContainer } from "../../common-controls";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import {
  convertPrescriptionLibraryToMasterDataDetail,
  getInitialMasterDataDetail,
} from "@/app/master-data/(etc)/master-data-converter";
import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import MyCheckbox from "@/components/yjg/my-checkbox";

interface PrescriptionLibraryGridProps {
  type: PrescriptionType;
  subType: PrescriptionSubType | null;
  setSelectedMasterDataDetail: (
    masterDataDetail: MasterDataDetailType | null
  ) => void;
  searchOptions: MySelectOption[];
  headerLocalStorageKey: string;
  defaultHeaders: MyGridHeaderType[];
  convertDataToGridRowType: (data: any[], lastIndex: number) => MyGridRowType[];
}

export default function PrescriptionMasterGrid({
  type,
  subType,
  setSelectedMasterDataDetail,
  searchOptions,
  headerLocalStorageKey,
  defaultHeaders,
  convertDataToGridRowType,
}: PrescriptionLibraryGridProps) {
  const [selectedSearchOption, setSelectedSearchOption] = useState<
    MySelectOption | undefined
  >(searchOptions[0]);
  const [searchWord, setSearchWord] = useState("");
  const debouncedSearchWord = useDebounce(searchWord, 500); // 500ms 디바운스
  const [dataMap, setDataMap] = useState<Map<number, MyGridRowType>>(new Map());
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(headerLocalStorageKey, defaultHeaders)
  );

  const [isIncludeAssessment, setIsIncludeAssessment] = useState(false);
  const [searchParams, setSearchParams] =
    useState<PrescriptionLibrariesParamType>({
      type,
      subType: subType ?? undefined,
      limit: 50,
      baseDate: formatDate(new Date(), "-"),
      ...(type === PrescriptionType.medical && { isIncludeAssessment: "false" }),
    });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchPrescriptionLibraries(searchParams);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = { ...prev };
      if (type === PrescriptionType.medical) {
        next.isIncludeAssessment = isIncludeAssessment ? "true" : "false";
      } else {
        delete next.isIncludeAssessment;
      }
      return next;
    });
  }, [isIncludeAssessment, type]);

  useEffect(() => {
    setSearchParams((prev) => {
      // searchOptions의 모든 키들을 제거
      const searchOptionKeys = searchOptions.map((option) => option.value);
      const filteredPrev = Object.fromEntries(
        Object.entries(prev).filter(([key]) => !searchOptionKeys.includes(key))
      );

      // selectedSearchOption의 키만 추가
      return {
        ...filteredPrev,
        [selectedSearchOption?.value as string]: debouncedSearchWord,
      };
    });
  }, [debouncedSearchWord, selectedSearchOption, searchOptions]);

  useEffect(() => {
    if (data?.pages) {
      const allRows: MyGridRowType[] = [];
      let rowIndex = 0;

      data.pages.forEach((page) => {
        const newRows = convertDataToGridRowType(page.items, rowIndex);
        newRows.forEach((row) => {
          allRows.push({
            ...row,
            rowIndex: rowIndex++,
          });
        });
      });

      setDataMap(new Map(allRows.map((row) => [row.rowIndex, row])));
    }
  }, [data]);

  const handleSelectedRows = async (selectedRows: MyGridRowType[]) => {
    if (selectedRows.length !== 1) return;
    const selectedRow = selectedRows[0];
    if (!selectedRow) return;
    const id = Number(selectedRow.key);
    if (!id) return;

    // row에서 claimCode 확인
    const claimCodeItem = selectedRow.cells.find(
      (item) => item.headerKey === "claimCode"
    );
    const claimCode = claimCodeItem?.value as string | undefined;

    // 청구코드가 없으면 새로작성 양식 생성
    if (!claimCode || claimCode.trim() === "") {
      const initialMasterDataDetail = getInitialMasterDataDetail(
        type,
        subType,
        0 // 비급여로 판단
      );
      setSelectedMasterDataDetail(initialMasterDataDetail);
      return;
    }

    // 청구코드가 있으면 기존처럼 API 호출
    const selectedPrescriptionLibrary =
      await PrescriptionLibrariesService.getPrescriptionLibraryDetail(type, id);
    var masterDataDetail = convertPrescriptionLibraryToMasterDataDetail(
      selectedPrescriptionLibrary ?? null,
      subType
    );
    setSelectedMasterDataDetail(masterDataDetail);
  };

  const handleLoadMore = () => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  };

  const handleSearch = (value: string) => {
    setSearchWord(value);
  };

  const handleClearSearch = () => {
    setSearchWord("");
  };

  useEffect(() => {
    saveHeaders(headerLocalStorageKey, headers);
  }, [headers]);

  const gridRef = useRef<MyGridRef>(null);

  return (
    <GridContainer>
      <div className="flex flex-row w-full items-center gap-2 my-scroll py-1.5">
        <div className="text-base font-semibold whitespace-nowrap px-3">
          MASTER 자료
        </div>
        <MySelect
          options={searchOptions}
          value={selectedSearchOption?.value}
          onChange={(value) =>
            setSelectedSearchOption(
              searchOptions?.find((option) => option.value === value)
            )
          }
        />
        {type === PrescriptionType.medical && (
          <MyCheckbox
            type="button"
            label="산정코드 포함"
            className="text-[12px] px-[6px] py-[3px]"
            checked={isIncludeAssessment}
            onChange={(checked) => setIsIncludeAssessment(!!checked)}
          />
        )}
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          inputTestId="master-data-master-search-input"
          placeholder={`${selectedSearchOption?.label} 검색`}
        />
        <div className="flex flex-row gap-2 items-center">
          <MyGridSettingButton
            defaultHeaders={defaultHeaders}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          testId="master-data-prescription-grid"
          ref={gridRef}
          headers={getHeaderWithCustomRender(
            headers,
            type,
            subType,
            setSearchParams,
            setDataMap
          )}
          data={Array.from(dataMap.values())}
          onHeadersChange={setHeaders}
          multiSelect={false}
          isLoading={isLoading}
          loadingMsg={`${getMasterDataTitle(type, subType)} 자료를 불러오는 중입니다...`}
          onSelectedRowsChange={handleSelectedRows}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          searchKeyword={searchWord}
        />
      </div>
    </GridContainer>
  );
}

function getHeaderWithCustomRender(
  headers: MyGridHeaderType[],
  type: PrescriptionType,
  subType: PrescriptionSubType | null,
  setSearchParams: (
    params: (
      prev: PrescriptionLibrariesParamType
    ) => PrescriptionLibrariesParamType
  ) => void,
  setDataMap: (dataMap: Map<number, MyGridRowType>) => void
) {
  return headers.map((header) => {
    switch (header.key) {
      case "itemType":
        return {
          ...header,
          customRender: (
            <PrescriptionMasterFilter
              filterKey="itemType"
              placeholder="항목구분"
              options={getItemTypeOptions(type, subType)}
              setSearchParams={setSearchParams}
              setDataMap={setDataMap}
            />
          ),
        };
      case "administrationRoute":
        return {
          ...header,
          customRender: (
            <PrescriptionMasterFilter
              filterKey="administrationRoute"
              placeholder="투여경로"
              options={ADMINISTRATION_ROUTE_OPTIONS}
              setSearchParams={setSearchParams}
              setDataMap={setDataMap}
            />
          ),
        };
    }
    return header;
  });
}

function getItemTypeOptions(
  type: PrescriptionType,
  subType: PrescriptionSubType | null
) {
  if (
    type == PrescriptionType.medical &&
    subType === PrescriptionSubType.action
  ) {
    return ITEM_TYPE_ACTION_OPTIONS;
  } else if (
    type == PrescriptionType.medical &&
    subType === PrescriptionSubType.examine
  ) {
    return ITEM_TYPE_EXAMINE_OPTIONS;
  } else if (type == PrescriptionType.material) {
    return ITEM_TYPE_MATERIAL_OPTIONS;
  } else {
    return ITEM_TYPE_OPTIONS;
  }
}
