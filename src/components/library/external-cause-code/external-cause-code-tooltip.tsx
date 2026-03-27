import React from "react";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { EXTERNAL_CAUSE_CODE_OPTIONS } from "@/components/library/external-cause-code/external-cause-code-option";

export default function ExternalCauseCodeTooltip({
  externalCauseCode,
}: {
  externalCauseCode: string;
}) {
  const tooltipText =
    EXTERNAL_CAUSE_CODE_OPTIONS.find(
      (externalCauseCodeItem) =>
        externalCauseCodeItem.code === externalCauseCode
    )?.content || externalCauseCode;

  return (
    <div className="flex items-center overflow-hidden">
      <MyTooltip content={tooltipText}>
        <div className="text-sm w-full px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis text-center">
          {externalCauseCode}
        </div>
      </MyTooltip>
    </div>
  );
}
