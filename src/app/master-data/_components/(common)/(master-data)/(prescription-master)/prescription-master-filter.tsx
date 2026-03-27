import { MySelect } from "@/components/yjg/my-select";
import type { PrescriptionLibrariesParamType } from "@/types/master-data/prescription-libraries/prescription-libraries-param-type";
import { useState } from "react";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";

interface PrescriptionMasterFilterProps {
  filterKey: string;
  placeholder: string;
  options: { label: string; value: string }[];
  setSearchParams: (
    params: (
      prev: PrescriptionLibrariesParamType
    ) => PrescriptionLibrariesParamType
  ) => void;
  setDataMap: (dataMap: Map<number, MyGridRowType>) => void;
}

export function PrescriptionMasterFilter({
  filterKey,
  placeholder,
  options,
  setSearchParams,
  setDataMap,
}: PrescriptionMasterFilterProps) {
  const [itemTypeFilter, setItemTypeFilter] = useState("");

  return (
    <div className="flex flex-row items-center p-[1px]">
      <MySelect
        placeholder={placeholder}
        className="border-none bg-transparent rounded-none font-medium"
        value={itemTypeFilter}
        options={[
          {
            label: "전체",
            value: "",
          },
          ...options,
        ]}
        onChange={(newValue) => {
          const value = String(newValue);
          if (itemTypeFilter === value) return;

          setItemTypeFilter(value);
          setDataMap(new Map());
          setSearchParams((prev: PrescriptionLibrariesParamType) => ({
            ...prev,
            [filterKey]: value || undefined,
            cursor: undefined,
          }));
        }}
      />
    </div>
  );
}
