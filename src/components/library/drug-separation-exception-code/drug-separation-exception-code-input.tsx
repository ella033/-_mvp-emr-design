import { useDrugSeparationExceptionCodes } from "@/hooks/drug-separation-exception-code/use-drug-separation-exception-code";
import { useEffect, useState } from "react";
import DrugSeparationExceptionCodePopup from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-popup";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";
import {
  GRID_FONT_SIZE_CLASS,
} from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";

interface DrugSeparationExceptionCodeInputProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  type: DrugSeparationExceptionCodeType;
  currentCode: string;
  onChange: (drugSeparationExceptionCode: string) => void;
  readonly?: boolean;
}

export default function DrugSeparationExceptionCodeInput({
  size,
  type,
  currentCode,
  onChange,
  readonly = false,
}: DrugSeparationExceptionCodeInputProps) {
  const [code, setCode] = useState(currentCode);
  const [openPopup, setOpenPopup] = useState(false);
  const { data: exceptionCodes } = useDrugSeparationExceptionCodes(type);
  const [tooltipText, setTooltipText] = useState("");

  useEffect(() => {
    setCode(currentCode);
  }, [currentCode]);

  useEffect(() => {
    setTooltipText(
      exceptionCodes?.find((exceptionCode) => exceptionCode.code === code)
        ?.title || code
    );
  }, [code, exceptionCodes]);

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
        <DrugSeparationExceptionCodePopup
          type={type}
          setOpen={setOpenPopup}
          currentExceptionCode={code}
          setExceptionCode={(value: string) => {
            handleSetExceptionCode(value);
          }}
        />
      )}
    </div>
  );
}
