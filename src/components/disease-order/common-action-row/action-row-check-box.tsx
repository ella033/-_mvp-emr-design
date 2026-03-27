import MyCheckbox from "@/components/yjg/my-checkbox";
import { useState } from "react";
import { type MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getCell } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export default function ActionRowCheckBox({
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
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex h-full w-full items-center justify-center">
      {selectedRows.length > 0 && (
        <MyCheckbox
          checked={checked}
          onChange={(checked) => {
            setChecked(checked);
            const checkBoxRows = selectedRows.filter((row) => {
              const cell = getCell(row, headerKey);
              return cell?.inputType === "checkbox";
            });
            onSelectedRowsDataChange(headerKey, checkBoxRows, checked);
          }}
        />
      )}
    </div>
  );
}
