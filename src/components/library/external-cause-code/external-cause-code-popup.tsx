import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import {
  defaultExternalCauseCodeHeaders,
  LS_EXTERNAL_CAUSE_CODE_HEADERS_KEY,
} from "./external-cause-code-header";
import { convertExternalCauseCodeToGridRowType } from "./external-cause-code-converter";
import {
  getCellValueAsString,
  getInitialHeaders,
  saveHeaders,
} from "@/components/yjg/my-grid/my-grid-util";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { useEffect, useState, useMemo } from "react";
import { EXTERNAL_CAUSE_CODE_OPTIONS } from "./external-cause-code-option";

export default function ExternalCauseCodePopup({
  currentExternalCauseCode,
  setExternalCauseCode,
  setOpen,
}: {
  currentExternalCauseCode: string;
  setExternalCauseCode: (externalCauseCode: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_EXTERNAL_CAUSE_CODE_HEADERS_KEY,
      defaultExternalCauseCodeHeaders
    )
  );
  const [selectedExternalCauseCode, setSelectedExternalCauseCode] =
    useState<string>(currentExternalCauseCode);

  const gridRows = useMemo(() => {
    const convertedRows = convertExternalCauseCodeToGridRowType(
      EXTERNAL_CAUSE_CODE_OPTIONS || []
    );
    return convertedRows;
  }, []);

  const initialSelectedRows = useMemo(() => {
    if (!currentExternalCauseCode) {
      const emptyRow = gridRows.find(
        (row) => getCellValueAsString(row, "code") === ""
      );
      return emptyRow ? [emptyRow] : undefined;
    }
    const selectedRow = gridRows.find(
      (row) => getCellValueAsString(row, "code") === currentExternalCauseCode
    );
    return selectedRow ? [selectedRow] : undefined;
  }, [currentExternalCauseCode, gridRows]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = (row: MyGridRowType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedExternalCauseCode(getCellValueAsString(row, "code") ?? "");
  };

  const handleDoubleClick = (
    _headerKey: string,
    row: MyGridRowType,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setExternalCauseCode(getCellValueAsString(row, "code") ?? "");
    setOpen(false);
  };

  const handleSave = () => {
    setExternalCauseCode(selectedExternalCauseCode);
    setOpen(false);
  };

  useEffect(() => {
    saveHeaders(LS_EXTERNAL_CAUSE_CODE_HEADERS_KEY, headers);
  }, [headers]);

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={handleClose}
      title="상해외인"
      width="300px"
      height="400px"
      minWidth="300px"
      minHeight="400px"
      localStorageKey={"external-cause-code-popup-settings"}
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
            multiSelect={false}
            initialSelectedRows={initialSelectedRows}
            onRowClick={handleClick}
            onRowDoubleClick={handleDoubleClick}
          />
        </div>
        <div className="flex flex-row flex-shrink-0 justify-end gap-2">
          <MyButton
            className="px-6"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            취소
          </MyButton>
          <MyButton className="px-6" onClick={handleSave}>
            저장
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
