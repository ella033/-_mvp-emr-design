import {
  PrescriptionSubType,
  PrescriptionType,
} from "@/constants/master-data-enum";
import { useEffect, useState, useRef } from "react";
import MyGrid, { MyGridRef } from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { getInitialHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { MyGridSettingButton } from "@/components/yjg/my-grid/my-grid-setting-button";
import MySearchInput from "@/components/yjg/my-search-input";
import { usePrescriptionUserCodes } from "@/hooks/master-data/use-prescription-user-codes";
import type { PrescriptionUserCodesParamType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-param-type";
import PrescriptionUserCodeContextMenu from "./prescription-user-code-context-menu";
import type { DoctorType } from "@/types/doctor-type";
import { useDoctorsStore } from "@/store/doctors-store";
import { PrescriptionMasterFilter } from "../(prescription-master)/prescription-master-filter";
import {
  ITEM_TYPE_OPTIONS,
  ITEM_TYPE_ACTION_OPTIONS,
  ITEM_TYPE_EXAMINE_OPTIONS,
  ITEM_TYPE_MATERIAL_OPTIONS,
} from "@/constants/library-option/item-type-option";
import { ADMINISTRATION_ROUTE_OPTIONS } from "@/constants/library-option/administration-route-option";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/date-utils";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import { GridContainer } from "../../common-controls";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import {
  convertPrescriptionUserCodeToMasterDataDetail,
  getInitialMasterDataDetail,
} from "@/app/master-data/(etc)/master-data-converter";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";

interface PrescriptionUserCodeGridProps {
  type: PrescriptionType;
  subType: PrescriptionSubType | null;
  setSelectedMasterDataDetail: (
    masterDataDetail: MasterDataDetailType | null
  ) => void;
  searchOptions: MySelectOption[];
  headerLocalStorageKey: string;
  defaultHeaders: MyGridHeaderType[];
  convertDataToGridRowType: (
    data: any[],
    lastIndex: number,
    doctors: DoctorType[]
  ) => MyGridRowType[];
  externalLabHospitalMappingId?: string;
  externalLabName?: string;
  externalLab?: ExternalLab;
  excludeSystemExternalLab?: boolean;
}

export default function PrescriptionUserCodeGrid({
  type,
  subType,
  setSelectedMasterDataDetail,
  searchOptions,
  headerLocalStorageKey,
  defaultHeaders,
  convertDataToGridRowType,
  externalLabHospitalMappingId,
  externalLabName,
  externalLab,
  excludeSystemExternalLab,
}: PrescriptionUserCodeGridProps) {
  const { doctors } = useDoctorsStore();
  const [selectedSearchOption, setSelectedSearchOption] = useState<
    MySelectOption | undefined
  >(searchOptions[0]);
  const [searchWord, setSearchWord] = useState("");
  const debouncedSearchWord = useDebounce(searchWord, 500); // 500ms 디바운스
  const [dataMap, setDataMap] = useState<Map<number, MyGridRowType>>(new Map());
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(headerLocalStorageKey, defaultHeaders)
  );

  const [searchParams, setSearchParams] =
    useState<PrescriptionUserCodesParamType>({
      type,
      subType: subType ?? undefined,
      limit: 50,
      baseDate: formatDate(new Date(), "-"),
      externalLabHospitalMappingId: externalLabHospitalMappingId,
      excludeSystemExternalLab: excludeSystemExternalLab,
    });
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePrescriptionUserCodes(searchParams);

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
        externalLabHospitalMappingId: externalLabHospitalMappingId,
        excludeSystemExternalLab: excludeSystemExternalLab,
      };
    });
  }, [
    debouncedSearchWord,
    selectedSearchOption,
    searchOptions,
    externalLabHospitalMappingId,
    excludeSystemExternalLab,
  ]);

  useEffect(() => {
    if (data?.pages) {
      const allRows: MyGridRowType[] = [];
      let rowIndex = 0;

      data.pages.forEach((page) => {
        const newRows = convertDataToGridRowType(page.items, rowIndex, doctors);
        newRows.forEach((row) => {
          allRows.push({
            ...row,
            rowIndex: rowIndex++,
          });
        });
      });

      setDataMap(new Map(allRows.map((row) => [row.rowIndex, row])));
    }
  }, [data, doctors, convertDataToGridRowType]);

  // externalLabExamination 관련 값들을 masterDataDetail에 추가하는 함수
  const applyExternalLabExaminationData = (
    masterDataDetail: MasterDataDetailType,
    selectedUserCode: PrescriptionUserCodeType,
    externalLabName?: string
  ): void => {
    if (!masterDataDetail.externalLabExaminationId) return;

    // externalLabExamination 객체가 있으면 그 값들을 사용
    if (selectedUserCode.externalLabExamination) {
      masterDataDetail.externalLabExaminationCode =
        selectedUserCode.externalLabExamination.examinationCode;
      masterDataDetail.externalLabUbCode =
        selectedUserCode.externalLabExamination.ubCode;
      masterDataDetail.externalLabExaminationName =
        selectedUserCode.externalLabExamination.name;
    }

    // externalLabName이 prop으로 전달되었거나 API 응답에 있으면 사용
    if (externalLabName) {
      masterDataDetail.externalLabName = externalLabName;
    } else if (selectedUserCode.externalLabName) {
      masterDataDetail.externalLabName = selectedUserCode.externalLabName;
    }
  };

  // 비급여 항목 처리 함수 (typePrescriptionLibraryId가 0인 경우)
  const handleNonCoveredItem = async (
    selectedUserCode: PrescriptionUserCodeType | null
  ): Promise<MasterDataDetailType | null> => {
    if (!selectedUserCode || selectedUserCode.typePrescriptionLibraryId !== 0) {
      return null;
    }

    const masterDataDetail = convertPrescriptionUserCodeToMasterDataDetail(
      selectedUserCode,
      subType
    );

    if (masterDataDetail) {
      applyExternalLabExaminationData(
        masterDataDetail,
        selectedUserCode,
        externalLabName || externalLab?.name
      );
      // isSystemProvided: true 탭에서 선택한 경우 수탁사 정보 추가
      if (externalLab?.isSystemProvided) {
        masterDataDetail.externalLabName = externalLab.name;
        masterDataDetail.externalLabHospitalMappingId =
          externalLab.externalLabHospitalMappingId || externalLab.id;
        masterDataDetail.isSystemExternalLab = true;
      }
    }

    return masterDataDetail;
  };

  // 일반 항목 처리 함수 (청구코드가 있는 경우)
  const handleCoveredItem = async (
    id: number
  ): Promise<MasterDataDetailType | null> => {
    const selectedUserCode =
      await PrescriptionUserCodeService.getPrescriptionUserCode(id);

    if (!selectedUserCode) {
      return null;
    }

    const masterDataDetail = convertPrescriptionUserCodeToMasterDataDetail(
      selectedUserCode,
      subType
    );

    if (masterDataDetail) {
      applyExternalLabExaminationData(
        masterDataDetail,
        selectedUserCode,
        externalLabName || externalLab?.name
      );
      // isSystemProvided: true 탭에서 선택한 경우 수탁사 정보 추가
      if (externalLab?.isSystemProvided) {
        masterDataDetail.externalLabName = externalLab.name;
        masterDataDetail.externalLabHospitalMappingId =
          externalLab.externalLabHospitalMappingId || externalLab.id;
        masterDataDetail.isSystemExternalLab = true;
      }
    }

    return masterDataDetail;
  };

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

    // 청구코드가 없으면 새로작성 양식 생성 (기존 동작)
    // 단, typePrescriptionLibraryId가 0인 경우는 비급여이지만 기존 userCode 정보를 표시해야 하므로 API 호출
    if (!claimCode || claimCode.trim() === "") {
      // typePrescriptionLibraryId가 0인지 확인하기 위해 API 호출
      const selectedUserCode =
        await PrescriptionUserCodeService.getPrescriptionUserCode(id);

      // 비급여 항목 처리
      const masterDataDetail = await handleNonCoveredItem(selectedUserCode);

      if (masterDataDetail) {
        setSelectedMasterDataDetail(masterDataDetail);
        return;
      }

      // 비급여가 아니거나 userCode가 없으면 새로작성 양식 생성
      const initialMasterDataDetail = getInitialMasterDataDetail(
        type,
        subType,
        0 // 비급여로 판단
      );
      setSelectedMasterDataDetail(initialMasterDataDetail);
      return;
    }

    // 청구코드가 있으면 기존처럼 API 호출 (기존 동작)
    const masterDataDetail = await handleCoveredItem(id);

    if (masterDataDetail) {
      setSelectedMasterDataDetail(masterDataDetail);
      return;
    }

    // userCode가 없으면 새로작성 양식 생성
    const initialMasterDataDetail = getInitialMasterDataDetail(
      type,
      subType,
      0 // 비급여로 판단
    );
    setSelectedMasterDataDetail(initialMasterDataDetail);
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
      <div className="flex flex-row w-full items-center gap-2 my-scroll">
        <div className="text-base font-semibold whitespace-nowrap px-3">
          등록된 자료
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
        <MySearchInput
          value={searchWord}
          onChange={(e) => handleSearch(e.target.value)}
          onClear={handleClearSearch}
          inputTestId="master-data-user-code-search-input"
          placeholder="사용자코드, 명칭 검색"
        />
        <div className="flex flex-row items-center">
          <MyGridSettingButton
            defaultHeaders={defaultHeaders}
            headers={headers}
            setHeaders={setHeaders}
          />
        </div>
      </div>
      <div className="flex-1 flex w-full h-full overflow-hidden">
        <MyGrid
          testId="master-data-user-code-grid"
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
          multiSelect={true}
          isLoading={isLoading}
          loadingMsg={`불러오는 중입니다...`}
          onSelectedRowsChange={handleSelectedRows}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          searchKeyword={searchWord}
          onContextMenu={(
            contextMenu,
            setContextMenu,
            selectedRows,
            setSelectedRows,
            setLastSelectedRow
          ) => (
            <PrescriptionUserCodeContextMenu
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              setLastSelectedRow={setLastSelectedRow}
            />
          )}
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
      prev: PrescriptionUserCodesParamType
    ) => PrescriptionUserCodesParamType
  ) => void,
  setDataMap: (dataMap: Map<number, MyGridRowType>) => void
) {
  return headers.map((header) => {
    switch (header.key) {
      case "isActive":
        return {
          ...header,
          customRender: (
            <PrescriptionMasterFilter
              filterKey="isActive"
              placeholder="사용여부"
              options={[
                {
                  label: "사용",
                  value: "true",
                },
                {
                  label: "미사용",
                  value: "false",
                },
              ]}
              setSearchParams={setSearchParams}
              setDataMap={setDataMap}
            />
          ),
        };

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
