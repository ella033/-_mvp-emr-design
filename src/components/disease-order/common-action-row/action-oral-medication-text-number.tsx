import MyInput from "@/components/yjg/my-input";
import { useState, useMemo } from "react";
import { type MyTreeGridHeaderType, type MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { getCell, getCellValueAsString } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { cn } from "@/lib/utils";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";
import { useUsages } from "@/hooks/usage/use-usage";

export default function ActionOralMedicationTextNumber({
  header,
  selectedRows,
  onSelectedRowsDataChange,
  sizeClass,
}: {
  header: MyTreeGridHeaderType;
  selectedRows: MyTreeGridRowType[];
  onSelectedRowsDataChange: (
    headerKey: string,
    selectedRows: MyTreeGridRowType[],
    value: string | number | boolean
  ) => void;
  sizeClass?: string;
}) {
  const [value, setValue] = useState("");
  const { data: usages } = useUsages();

  // 내복약 필터링 + times일 경우 usage에 times가 설정된 행 제외
  const oralMedicationRows = useMemo(() => {
    if (!selectedRows[0]) return [];

    return selectedRows.filter((row) => {
      const cell = getCell(row, header.key);
      const itemType = getCellValueAsString(row, "itemType");

      // 기본 조건: textNumber 입력 타입 + 내복약
      const isOralMedication =
        cell?.inputType === "textNumber" &&
        itemType === ItemTypeCode.투약료_내복약;

      if (!isOralMedication) return false;

      // times(일투) 헤더일 경우, usage에 times가 설정된 행은 제외
      if (header.key === "times" && usages) {
        const usageCode = getCellValueAsString(row, "usage");
        if (usageCode) {
          const matchedUsage = usages.find((u) => u.code === usageCode);
          // usage에 times가 설정되어 있으면 제외
          if (matchedUsage && matchedUsage.times > 0) {
            return false;
          }
        }
      }

      return true;
    });
  }, [selectedRows, header.key, usages]);

  const firstRow = oralMedicationRows[0];
  if (!firstRow) return null;
  const cell = getCell(firstRow, header.key);

  return (
    <MyTooltip content={`선택된 항목 중 내복약의 ${header.name}이(가) 일괄변경됩니다.`}>
      <div className="flex h-full w-full items-center justify-center">
        <MyInput
          type="text-number"
          className={cn(
            "w-full h-full rounded-none mx-1 text-center",
            sizeClass
          )}
          value={value}
          onChange={(value: string) => {
            setValue(value);
            onSelectedRowsDataChange(header.key, oralMedicationRows, value);
          }}
          min={cell?.textNumberOption?.min}
          max={cell?.textNumberOption?.max}
          pointPos={cell?.textNumberOption?.pointPos}
          pointType={cell?.textNumberOption?.pointType}
          unit={cell?.textNumberOption?.unit}
          showComma={cell?.textNumberOption?.showComma}
        />
      </div>
    </MyTooltip>
  );
}
