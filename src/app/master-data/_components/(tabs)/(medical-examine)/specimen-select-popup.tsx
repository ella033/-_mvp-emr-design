import MyPopup from "@/components/yjg/my-pop-up";
import MySearchInput from "@/components/yjg/my-search-input";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { getCellValueAsString } from "@/components/yjg/my-grid/my-grid-util";
import { MyButton } from "@/components/yjg/my-button";
import { useState, useMemo } from "react";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { MOCK_SPECIMEN_LIBRARIES } from "@/mocks/examination-label/mock-data";

const SPECIMEN_SELECT_POPUP_STORAGE_KEY = "specimen-select-popup-settings";

const specimenHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: 0,
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: 1,
  },
];

interface SpecimenSelectPopupProps {
  setOpen: (open: boolean) => void;
  currentSpecimen: SpecimenDetail | null;
  onSelect: (specimen: SpecimenDetail) => void;
}

export default function SpecimenSelectPopup({
  setOpen,
  currentSpecimen,
  onSelect,
}: SpecimenSelectPopupProps) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(specimenHeaders);
  const [searchWord, setSearchWord] = useState("");
  const [selectedRow, setSelectedRow] = useState<MyGridRowType | null>(null);

  const filteredData = useMemo(() => {
    if (!searchWord.trim()) return MOCK_SPECIMEN_LIBRARIES;
    const keyword = searchWord.trim().toLowerCase();
    return MOCK_SPECIMEN_LIBRARIES.filter(
      (item) =>
        item.code.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword)
    );
  }, [searchWord]);

  const rows: MyGridRowType[] = filteredData.map((item, index) => ({
    rowIndex: index + 1,
    key: item.id,
    cells: [
      { headerKey: "code", value: item.code },
      { headerKey: "name", value: item.name },
    ],
  }));

  // 현재 선택된 검체가 있으면 초기 선택 행 설정
  const initialSelectedRows = useMemo(() => {
    if (!currentSpecimen) return undefined;
    const found = MOCK_SPECIMEN_LIBRARIES.find(
      (item) => item.code === currentSpecimen.code
    );
    if (!found) return undefined;
    return [
      {
        rowIndex: MOCK_SPECIMEN_LIBRARIES.indexOf(found) + 1,
        key: found.id,
        cells: [
          { headerKey: "code", value: found.code },
          { headerKey: "name", value: found.name },
        ],
      },
    ];
  }, [currentSpecimen]);

  const handleClose = () => setOpen(false);

  const handleApply = () => {
    if (!selectedRow) return;
    onSelect({
      code: getCellValueAsString(selectedRow, "code") ?? "",
      name: getCellValueAsString(selectedRow, "name") ?? "",
    });
    setOpen(false);
  };

  const handleRowDoubleClick = (
    _headerKey: string,
    row: MyGridRowType,
    _event: React.MouseEvent
  ) => {
    onSelect({
      code: getCellValueAsString(row, "code") ?? "",
      name: getCellValueAsString(row, "name") ?? "",
    });
    setOpen(false);
  };

  const handleSelectedRowsChange = (
    selectedRows: MyGridRowType[],
    isClickOutside?: boolean
  ) => {
    if (isClickOutside) return;
    setSelectedRow(selectedRows[0] ?? null);
  };

  return (
    <MyPopup
      isOpen={true}
      closeOnOutsideClick={false}
      onCloseAction={handleClose}
      title="검체코드 선택"
      width="450px"
      height="500px"
      minWidth="350px"
      minHeight="400px"
      localStorageKey={SPECIMEN_SELECT_POPUP_STORAGE_KEY}
    >
      <div className="flex h-full w-full flex-col gap-2 p-2">
        <div className="flex flex-row w-full items-center gap-2">
          <MySearchInput
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            onClear={() => setSearchWord("")}
            placeholder="코드 또는 명칭으로 검색"
          />
        </div>
        <div className="flex-1 min-h-0 flex w-full overflow-hidden">
          <MyGrid
            headers={headers}
            onHeadersChange={setHeaders}
            data={rows}
            initialSelectedRows={initialSelectedRows}
            onSelectedRowsChange={handleSelectedRowsChange}
            onRowDoubleClick={handleRowDoubleClick}
          />
        </div>
        <div className="flex flex-row items-center justify-end gap-2">
          <MyButton className="px-4" onClick={handleClose} variant="outline">
            취소
          </MyButton>
          <MyButton
            className="px-4"
            onClick={handleApply}
            disabled={!selectedRow}
          >
            적용
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
