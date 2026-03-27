import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import {
  defaultExceptionCodeHeaders,
  LS_EXCEPTION_CODE_HEADERS_KEY,
} from "./exception-code-header";
import { useDrugSeparationExceptionCodes } from "@/hooks/drug-separation-exception-code/use-drug-separation-exception-code";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import { convertExceptionCodeToGridRowType } from "./exception-code-converter";
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

export default function DrugSeparationExceptionCodePopup({
  type,
  currentExceptionCode,
  setExceptionCode,
  setOpen,
}: {
  type: DrugSeparationExceptionCodeType;
  currentExceptionCode: string;
  setExceptionCode: (exceptionCode: string) => void;
  setOpen: (open: boolean) => void;
}) {
  const [headers, setHeaders] = useState<MyGridHeaderType[]>(
    getInitialHeaders(
      LS_EXCEPTION_CODE_HEADERS_KEY,
      defaultExceptionCodeHeaders
    )
  );
  const { data: exceptionCodes } = useDrugSeparationExceptionCodes(type);
  const [selectedExceptionCode, setSelectedExceptionCode] =
    useState<string>(currentExceptionCode);

  const gridRows = useMemo(() => {
    const convertedRows = convertExceptionCodeToGridRowType(
      exceptionCodes || []
    );

    // "선택없음" row 추가 (code가 빈값)
    const emptyCodeRow: MyGridRowType = {
      key: "",
      rowIndex: 0,
      cells: [
        {
          headerKey: "code",
          value: "",
        },
        {
          headerKey: "title",
          value: "선택없음",
        },
        {
          headerKey: "content",
          value: "의약분업 예외코드 없음",
        },
      ],
    };
    return [emptyCodeRow, ...convertedRows];
  }, [exceptionCodes]);

  const initialSelectedRows = useMemo(() => {
    if (!currentExceptionCode) {
      // currentExceptionCode가 없으면 빈 code row 선택
      const emptyRow = gridRows.find(
        (row) => getCellValueAsString(row, "code") === ""
      );
      return emptyRow ? [emptyRow] : undefined;
    }
    const selectedRow = gridRows.find(
      (row) => getCellValueAsString(row, "code") === currentExceptionCode
    );
    return selectedRow ? [selectedRow] : undefined;
  }, [currentExceptionCode, gridRows]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleClick = (row: MyGridRowType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedExceptionCode(getCellValueAsString(row, "code") ?? "");
  };

  const handleDoubleClick = (
    _headerKey: string,
    row: MyGridRowType,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setExceptionCode(getCellValueAsString(row, "code") ?? "");
    setOpen(false);
  };

  const handleSave = () => {
    setExceptionCode(selectedExceptionCode);
    setOpen(false);
  };

  useEffect(() => {
    saveHeaders(LS_EXCEPTION_CODE_HEADERS_KEY, headers);
  }, [headers]);

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={handleClose}
      title="의약분업 예외코드"
      width="500px"
      height="450px"
      minWidth="500px"
      minHeight="450px"
      localStorageKey={"exception-code-popup-settings"}
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
