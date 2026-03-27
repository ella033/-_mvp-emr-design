import { useEffect, useState } from "react";
import { type MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { EXTERNAL_CAUSE_CODE_OPTIONS } from "@/components/library/external-cause-code/external-cause-code-option";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import ExternalCauseCodePopup from "@/components/library/external-cause-code/external-cause-code-popup";

export default function DiseaseActionExternalCauseCode({
  headerKey,
  selectedRows,
  onSelectedRowsDataChange,
}: {
  headerKey: string;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
}) {
  const [externalCauseCodeValue, setExternalCauseCodeValue] = useState("");
  const [openPopup, setOpenPopup] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  useEffect(() => {
    if (selectedRows && selectedRows.length > 0) {
      const cell = selectedRows[0]?.cells.find(
        (cell) => cell.headerKey === headerKey
      );
      setExternalCauseCodeValue((cell?.value as string) || "");
    }
  }, [selectedRows]);

  useEffect(() => {
    if (Array.isArray(EXTERNAL_CAUSE_CODE_OPTIONS)) {
      setTooltipText(
        EXTERNAL_CAUSE_CODE_OPTIONS.find(
          (externalCauseCode) =>
            externalCauseCode.code === externalCauseCodeValue
        )?.content || externalCauseCodeValue
      );
    } else {
      setTooltipText(externalCauseCodeValue);
    }
  }, [externalCauseCodeValue, EXTERNAL_CAUSE_CODE_OPTIONS]);

  const handleSetExceptionCode = (value: string) => {
    setExternalCauseCodeValue(value);
    const externalCauseCodeRows = selectedRows.filter((row) => {
      return (
        row.cells.find((cell) => cell.headerKey === headerKey)?.inputType ===
        "external-cause-code"
      );
    });
    onSelectedRowsDataChange(headerKey, externalCauseCodeRows, value);
  };

  return (
    <div
      className="flex flex-1 items-center justify-center px-2 py-1 min-w-0 h-full cursor-pointer hover:bg-[var(--bg-tertiary)]"
      onClick={() => setOpenPopup(true)}
    >
      {selectedRows.length > 0 && (
        <>
          <MyTooltip side="left" align="start" content={tooltipText}>
            <div className="text-[12px]">{externalCauseCodeValue}</div>
          </MyTooltip>
          {openPopup && (
            <ExternalCauseCodePopup
              setOpen={setOpenPopup}
              currentExternalCauseCode={externalCauseCodeValue}
              setExternalCauseCode={(value: string) => {
                handleSetExceptionCode(value);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
