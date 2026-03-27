import React from "react";

import { useDrugSeparationExceptionCodes } from "@/hooks/drug-separation-exception-code/use-drug-separation-exception-code";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";

export default function DrugSeparationExceptionCodeTooltip({
  type,
  exceptionCode,
}: {
  type: DrugSeparationExceptionCodeType;
  exceptionCode: string;
}) {
  const { data: exceptionCodes } = useDrugSeparationExceptionCodes(type);

  const tooltipText =
    exceptionCodes?.find(
      (exceptionCodeItem) => exceptionCodeItem.code === exceptionCode
    )?.content || exceptionCode;

  return (
    <div className="flex items-center overflow-hidden">
      <MyTooltip content={tooltipText}>
        <div className="text-sm w-full px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis text-center">
          {exceptionCode}
        </div>
      </MyTooltip>
    </div>
  );
}
