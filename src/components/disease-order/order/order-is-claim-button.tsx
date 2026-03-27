import { cn } from "@/lib/utils";
import {
  getRowHeight,
  getCellValueAsBoolean,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { GRID_FONT_SIZE } from "@/components/yjg/common/constant/class-constants";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

interface OrderIsClaimButtonProps {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  row: MyTreeGridRowType;
  onDataChangeItem?: (
    headerKey: string,
    row: MyTreeGridRowType,
    value: string | number | boolean
  ) => void;
}

export default function OrderIsClaimButton({
  size,
  row,
  onDataChangeItem,
}: OrderIsClaimButtonProps) {
  const isClaim = getCellValueAsBoolean(row, "isClaim");
  const rowHeight = getRowHeight(size);
  const widthHeight = rowHeight - 4;
  const fontSize = GRID_FONT_SIZE[size];
  const sizeStyle = { width: widthHeight, height: widthHeight, fontSize };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDataChangeItem?.("isClaim", row, !isClaim);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-[var(--border-1)] rounded select-none",
        isClaim
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-transparent",
      )}
      style={sizeStyle}
      onClick={handleClick}
      title={isClaim ? "청구" : "비청구"}
    >
      {isClaim ? "청" : "비"}
    </div>
  );
}