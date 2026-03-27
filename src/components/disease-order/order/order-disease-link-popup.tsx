import { MyButton } from "@/components/yjg/my-button";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import {
  getCellValueAsNumber,
  getCellValueAsString,
  getInitialHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import MyPopup from "@/components/yjg/my-pop-up";
import type { DiseaseBase } from "@/types/chart/disease-types";
import type { DiseaseLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { useCallback, useMemo, useState } from "react";

const LS_ORDER_DISEASE_LINK_POPUP_SETTINGS_KEY = "order-disease-lin-headers";

const orderDiseaseLinkPopupHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 100,
    minWidth: 30,
  },
  {
    key: "name",
    name: "명칭",
    width: 400,
    minWidth: 200,
  },
];

const defaultOrderDiseaseLinkPopupHeaders = orderDiseaseLinkPopupHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

function convertDiseaseLinkToGridRowType(
  diseaseLinks: DiseaseLinkType[]
): MyGridRowType[] {
  return diseaseLinks.map((diseaseLink, index) => ({
    key: diseaseLink.id,
    rowIndex: index + 1,
    cells: [
      {
        headerKey: "diseaseId",
        value: diseaseLink.id,
      },
      {
        headerKey: "code",
        value: diseaseLink.code,
      },
      {
        headerKey: "name",
        value: diseaseLink.name,
      },
    ],
  }));
}

export default function OrderDiseaseLinkPopup({
  diseaseLinks,
  addNewDiseases,
  setOpen,
}: {
  diseaseLinks: DiseaseLinkType[];
  addNewDiseases: (diseases: DiseaseBase[]) => void;
  setOpen: (open: boolean) => void;
}) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_ORDER_DISEASE_LINK_POPUP_SETTINGS_KEY,
      defaultOrderDiseaseLinkPopupHeaders
    )
  );
  const [selectedRows, setSelectedRows] = useState<MyGridRowType[]>([]);

  const gridRows = useMemo(() => {
    return convertDiseaseLinkToGridRowType(diseaseLinks);
  }, [diseaseLinks]);

  const handleSelectedRows = useCallback((selectedRows: MyGridRowType[]) => {
    setSelectedRows(selectedRows);
  }, []);

  const handleApply = () => {
    addNewDiseases(
      selectedRows.map((selectedRow) => ({
        diseaseId: getCellValueAsNumber(selectedRow, "diseaseId") ?? 0,
        code: getCellValueAsString(selectedRow, "code") ?? "",
        name: getCellValueAsString(selectedRow, "name") ?? "",
      }))
    );
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={() => setOpen(false)}
      title="연결상병"
      width="500px"
      height="300px"
      minWidth="500px"
      minHeight="300px"
      localStorageKey="order-disease-link-popup-settings"
    >
      <div
        className="flex flex-col gap-2 p-2 h-full w-full"
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex-1 flex w-full h-full overflow-hidden">
          <MyGrid
            size="sm"
            headers={headers}
            onHeadersChange={setHeaders}
            data={gridRows}
            isRowSelectByCheckbox={true}
            onSelectedRowsChange={handleSelectedRows}
          />
        </div>
        <div className="flex flex-row flex-shrink-0 justify-end gap-2">
          <MyButton className="px-6" variant="outline" onClick={handleCancel}>
            취소
          </MyButton>
          <MyButton className="px-6" onClick={handleApply}>
            적용
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
