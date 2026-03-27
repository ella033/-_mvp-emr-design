import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { UsageCode } from "@/types/usage-code-types";
import { USAGE_CATEGORY_OPTIONS } from "@/constants/common/common-option";
import { UsageCategory } from "@/constants/common/common-enum";

export const convertUsagesToMyGridType = (
  usages: UsageCode[],
  DeleteUsageButton: (id: number) => React.ReactNode
): MyGridRowType[] => {
  return usages.map((usage, index) => ({
    rowIndex: index,
    key: `usage-${usage.id}-${index}`,
    cells: [
      {
        headerKey: "id",
        value: usage.id,
      },
      {
        headerKey: "code",
        value: usage.code,
      },
      {
        headerKey: "usage",
        value: usage.usage,
      },
      {
        headerKey: "category",
        value: USAGE_CATEGORY_OPTIONS.find(
          (option) => option.value === usage.category
        )?.label,
      },
      {
        headerKey: "times",
        value: isTimesEnabled(usage.category)
          ? usage.times > 0
            ? usage.times
            : ""
          : "-",
      },
    ],
    rowAction: DeleteUsageButton(usage.id),
  }));
};

export const isTimesEnabled = (category: UsageCategory) => {
  return [
    UsageCategory.INJECTION,
    UsageCategory.EXTERNAL,
    UsageCategory.INTERNAL,
  ].includes(category);
};
