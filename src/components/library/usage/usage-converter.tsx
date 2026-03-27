import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { UsageCode } from "@/types/usage-code-types";

export const convertUsageCodeToGridRowType = (
  items: UsageCode[]
): MyGridRowType[] => {
  return items.map((item, index) => ({
    key: item.code,
    rowIndex: index + 1,
    cells: [
      {
        headerKey: "code",
        value: item.code,
      },
      {
        headerKey: "usage",
        value: item.usage,
      },
      {
        headerKey: "times",
        value: item.times,
      },
    ],
  }));
};