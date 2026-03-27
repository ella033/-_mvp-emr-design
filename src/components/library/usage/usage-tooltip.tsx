import React from "react";

import { MyTooltip } from "@/components/yjg/my-tooltip";
import { useUsages } from "@/hooks/usage/use-usage";

export default function UsageTooltip({ usageCode }: { usageCode: string }) {
  const { data: usages } = useUsages();

  const tooltipText =
    usages?.find((usageItem) => usageItem.code === usageCode)?.usage ||
    usageCode;

  return (
    <div className="flex items-center overflow-hidden">
      <MyTooltip content={tooltipText}>
        <div className="text-sm w-full px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis text-center">
          {usageCode}
        </div>
      </MyTooltip>
    </div>
  );
}
