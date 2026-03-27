import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import SpecificDetailPopup from "./specific-detail-popup";
import { parseSpecificDetail, getSpecificDetailEmptyContentInfo } from "@/components/disease-order/order/order-util";
import { SpecificDetailIcon, SpecificDetailEmptyIcon } from "@/components/custom-icons";
import { ITEM_TYPE_ICON_SIZE_CLASS } from "@/components/yjg/common/constant/class-constants";
import { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { SpecificDetailCodeType } from "@/types/chart/specific-detail-code-type";
import { MyTooltip } from "@/components/yjg/my-tooltip";

interface SpecificDetailInputProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  row?: MyTreeGridRowType;
  currentSpecificDetail: string;
  onChange: (specificDetail: string) => void;
  readonly?: boolean;
}

export default function SpecificDetailInput({
  size,
  row,
  currentSpecificDetail,
  onChange,
  readonly = false,
}: SpecificDetailInputProps) {
  const [openPopup, setOpenPopup] = useState(false);

  const iconClass = ITEM_TYPE_ICON_SIZE_CLASS[size];

  const parsedSpecificDetails = useMemo(
    () => parseSpecificDetail(currentSpecificDetail),
    [currentSpecificDetail]
  );

  const hasSpecificDetail = parsedSpecificDetails.length > 0;

  const { hasEmptyContent, emptyContentTooltipMessage } = useMemo(
    () => getSpecificDetailEmptyContentInfo(parsedSpecificDetails),
    [parsedSpecificDetails]
  );

  const tooltipContent = useMemo(() => {
    if (!hasSpecificDetail) return "";
    if (hasEmptyContent) return emptyContentTooltipMessage;
    if (parsedSpecificDetails.length === 1) {
      const item = parsedSpecificDetails[0];
      if (!item) return "";
      return `${item.code} ${item.content}`;
    }
    const firstCode = parsedSpecificDetails[0]?.code ?? "";
    return `${firstCode} 외 ${parsedSpecificDetails.length - 1}건`;
  }, [hasSpecificDetail, hasEmptyContent, emptyContentTooltipMessage, parsedSpecificDetails]);

  const handleOpenPopup = () => {
    setOpenPopup(true);
  };

  if (readonly) {
    return (
      <MyTooltip content={tooltipContent}>
        <div
          className={cn(
            "flex flex-1 self-stretch items-center justify-center min-w-0 w-full h-full cursor-default"
          )}
        >
          {hasSpecificDetail ? (
            hasEmptyContent ? (
              <SpecificDetailEmptyIcon className={cn(iconClass, "text-[var(--gray-500)]")} />
            ) : (
              <SpecificDetailIcon className={cn(iconClass)} />
            )
          ) : (
            <div className="w-full h-full">&nbsp;</div>
          )}
        </div>
      </MyTooltip>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-1 self-stretch items-center justify-center min-w-0 w-full h-full cursor-pointer"
      )}
      onMouseDown={(e) => {
        // row 선택/드래그 전파만 막고, 실제 오픈은 click에서 처리
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleOpenPopup();
      }}
      onKeyDown={(e) => {
        if (e.key === " " && !openPopup) {
          e.preventDefault();
          handleOpenPopup();
        }
      }}
      data-popup-trigger="true"
    >
      <MyTooltip content={tooltipContent}>
        <div className="flex w-full h-full items-center justify-center">
          {hasSpecificDetail ? (
            hasEmptyContent ? (
              <SpecificDetailEmptyIcon className={cn(iconClass, "text-[var(--gray-500)]")} />
            ) : (
              <SpecificDetailIcon className={cn(iconClass)} />
            )
          ) : (
            <div className="w-full h-full">&nbsp;</div>
          )}
        </div>
      </MyTooltip>
      {openPopup && (
        <SpecificDetailPopup
          type={SpecificDetailCodeType.Line}
          row={row}
          currentSpecificDetails={parsedSpecificDetails}
          setOpen={setOpenPopup}
          onChange={(specificDetails) => onChange(JSON.stringify(specificDetails))}
        />
      )}
    </div>
  );
}
