import { useEffect, useState } from "react";
import ExternalCauseCodePopup from "@/components/library/external-cause-code/external-cause-code-popup";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import {
  GRID_FONT_SIZE_CLASS,
} from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import { EXTERNAL_CAUSE_CODE_OPTIONS } from "./external-cause-code-option";

interface ExternalCauseCodeInputProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  currentCode: string;
  onChange: (externalCauseCode: string) => void;
  readonly?: boolean;
}

export default function ExternalCauseCodeInput({
  size,
  currentCode,
  onChange,
  readonly = false,
}: ExternalCauseCodeInputProps) {
  const [code, setCode] = useState(currentCode);
  const [openPopup, setOpenPopup] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  useEffect(() => {
    setCode(currentCode);
  }, [currentCode]);

  useEffect(() => {
    setTooltipText(
      EXTERNAL_CAUSE_CODE_OPTIONS?.find(
        (externalCauseCode) => externalCauseCode.code === code
      )?.content || code
    );
  }, [code, EXTERNAL_CAUSE_CODE_OPTIONS]);

  const handleSetExceptionCode = (value: string) => {
    setCode(value);
    onChange(value);
  };

  if (readonly) {
    return (
      <MyTooltip side="left" align="start" content={tooltipText}>
        <div
          className={cn(
            "flex flex-1 items-center justify-center min-w-0 h-full text-ellipsis overflow-hidden whitespace-nowrap cursor-default",
            GRID_FONT_SIZE_CLASS[size]
          )}
        >
          {code || "\u00A0"}
        </div>
      </MyTooltip>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-1 items-center justify-center min-w-0 h-full cursor-pointer"
      )}
      onClick={() => setOpenPopup(true)}
      onKeyDown={(e) => {
        if (e.key === " ") {
          e.preventDefault();
          setOpenPopup(true);
        }
      }}
      data-popup-trigger="true"
    >
      <MyTooltip side="left" align="start" content={tooltipText}>
        <div
          className={cn(
            "text-ellipsis overflow-hidden whitespace-nowrap",
            GRID_FONT_SIZE_CLASS[size]
          )}
        >
          {code}
        </div>
      </MyTooltip>
      {openPopup && (
        <ExternalCauseCodePopup
          setOpen={setOpenPopup}
          currentExternalCauseCode={code}
          setExternalCauseCode={(value: string) => {
            handleSetExceptionCode(value);
          }}
        />
      )}
    </div>
  );
}
