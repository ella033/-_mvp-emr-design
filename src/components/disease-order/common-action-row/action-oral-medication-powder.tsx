import MyCheckbox from "@/components/yjg/my-checkbox";
import { useState } from "react";
import { type MyTreeGridHeaderType, type MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getCell, getCellValueAsString } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

export default function ActionOralMedicationPowder({
  header,
  selectedRows,
  onSelectedRowsDataChange,
}: {
  header: MyTreeGridHeaderType;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
}) {
  const [checked, setChecked] = useState(false);
  if (!selectedRows[0]) return null;

  const oralMedicationRows = selectedRows.filter((row) => {
    const cell = getCell(row, header.key);
    const itemType = getCellValueAsString(row, "itemType");
    return (
      cell?.inputType === "checkbox" &&
      itemType === ItemTypeCode.투약료_내복약
    );
  });

  if (!oralMedicationRows[0] || oralMedicationRows.length === 0) return null;

  return (
    <MyTooltip content={`선택된 항목 중 내복약의 가루여부가 일괄변경됩니다.`}>
      <div className="flex h-full w-full items-center justify-center">
        {selectedRows.length > 0 && (
          <MyCheckbox
            checked={checked}
            onChange={(checked) => {
              setChecked(checked);
              onSelectedRowsDataChange(header.key, oralMedicationRows, checked);
            }}
          />
        )}
      </div>
    </MyTooltip>
  );
}
