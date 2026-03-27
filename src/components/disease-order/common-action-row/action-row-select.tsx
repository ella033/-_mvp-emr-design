import { useState } from "react";
import { type MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import { cn } from "@/lib/utils";

export default function ActionRowSelect({
  options,
  headerKey,
  selectedRows,
  onSelectedRowsDataChange,
  sizeClass,
}: {
  options: MySelectOption[];
  headerKey: string;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  sizeClass?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <div className="flex h-full w-full items-center justify-center">
      {selectedRows.length > 0 && (
        <MySelect
          value={value}
          parentClassName="w-full"
          className={cn(sizeClass, "w-full border-none bg-transparent")}
          options={options}
          onChange={(option) => {
            setValue(option as string);
            onSelectedRowsDataChange(headerKey, selectedRows, option);
          }}
        />
      )}
    </div>
  );
}
