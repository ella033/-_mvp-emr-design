import { findParentRow, getRowHeight } from "./my-tree-grid-util";
import type { MyTreeGridRowType } from "./my-tree-grid-type";
import { Folder } from "lucide-react";
import {
  TreeChildLineIcon,
  TreeLastChildLineIcon,
  TreeVerticalLineIcon,
} from "@/components/custom-icons";
import {
  ITEM_TYPE_CONTAINER_SIZE_CLASS,
  ITEM_TYPE_CONTAINER_SIZE_PX,
  ITEM_TYPE_ICON_SIZE_CLASS,
  ITEM_TYPE_ICON_SIZE_PX,
} from "../common/constant/class-constants";
import { cn } from "@/lib/utils";
import { CaretDownIcon } from "@/components/custom-icons";

export default function MyTreeGridRowIcon({
  size,
  data,
  row,
  onToggleExpansion,
  showRowIcon = true,
}: {
  size: "xs" | "sm" | "default" | "lg" | "xl";
  data: MyTreeGridRowType[];
  row: MyTreeGridRowType;
  onToggleExpansion?: (row: MyTreeGridRowType) => void;
  /** false면 row.iconBtn(지시 버튼 등)을 표시하지 않음 */
  showRowIcon?: boolean;
}) {
  if (row.parentRowKey === null && row.type === "item") {
    if (!showRowIcon) return null;
    return <>{row.iconBtn}</>;
  }

  const iconSizeClass =
    ITEM_TYPE_ICON_SIZE_CLASS[size as keyof typeof ITEM_TYPE_ICON_SIZE_CLASS];
  const rowHeight = getRowHeight(size);
  const hasChildren = !!row.children && row.children.length > 0;
  const isFolderRow = row.type === "folder" || row.type === "fixed-folder";
  const useFolderHoverChevron = isFolderRow && hasChildren;
  const { parent } = findParentRow(data, row.rowKey);
  const siblings = parent ? parent.children || [] : data;
  const currentIndex = siblings.findIndex((n) => n.rowKey === row.rowKey);
  const isLastChild = currentIndex === siblings.length - 1;

  const { parent: grandParent } = findParentRow(data, parent?.rowKey ?? "");
  const parentSiblings = grandParent ? grandParent.children || [] : data;
  const parentCurrentIndex = parentSiblings.findIndex(
    (n) => n.rowKey === parent?.rowKey
  );
  const isParentLastChild = parentCurrentIndex === parentSiblings.length - 1;

  const ChildLine = (level: number) => {
    if (level === row.level) {
      if (isLastChild) {
        return (
          <TreeLastChildLineIcon
            height={rowHeight}
            className="text-[var(--gray-400)]"
          />
        );
      } else {
        return (
          <TreeChildLineIcon
            height={rowHeight}
            className="text-[var(--gray-400)]"
          />
        );
      }
    } else {
      if (isParentLastChild && level === (row.level ?? 0) - 1) return null;

      return (
        <TreeVerticalLineIcon
          height={rowHeight}
          className="text-[var(--gray-400)]"
        />
      );
    }
  };

  const icon = () => {
    switch (row.type) {
      case "folder":
      case "fixed-folder":
        return (
          <Folder
            className={cn(
              iconSizeClass,
              "text-[var(--gray-400)]",
            )}
          />
        );
      default:
        if (!showRowIcon) return null;
        return <>{row.iconBtn}</>;
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (row.children && row.children.length > 0 && onToggleExpansion) {
      onToggleExpansion(row);
    }
  };

  const iconContainerSizePx =
    ITEM_TYPE_CONTAINER_SIZE_PX[
    size as keyof typeof ITEM_TYPE_CONTAINER_SIZE_PX
    ];
  const iconSizePx = ITEM_TYPE_ICON_SIZE_PX[size as keyof typeof ITEM_TYPE_ICON_SIZE_PX];
  const iconContainerHalf = iconContainerSizePx / 2 - iconSizePx / 2;

  return (
    <div className="flex items-center" style={{ height: `${rowHeight}px` }}>
      {Array.from({ length: row.level ?? 0 }, (_, index) => (
        <div
          key={index}
          className="flex flex-row items-center"
          style={{ paddingLeft: `${iconContainerHalf}px` }}
        >
          <div
            className="relative"
            style={{ width: `${iconContainerSizePx - iconContainerHalf}px` }}
          >
            {ChildLine(index + 1)}
          </div>
        </div>
      ))}
      {hasChildren && !useFolderHoverChevron && (
        <div
          className={cn(
            "flex justify-center items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
            ITEM_TYPE_CONTAINER_SIZE_CLASS[size]
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onClick={handleChevronClick}
        >
          <CaretDownIcon
            className={iconSizeClass}
            style={{
              transform: row.isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            }}
          />
        </div>
      )}
      <div
        className={cn(
          "relative flex justify-center items-center",
          isFolderRow
            ? ITEM_TYPE_CONTAINER_SIZE_CLASS[size]
            : "h-full",
          useFolderHoverChevron && "group"
        )}
      >
        <div
          className={cn(
            "flex justify-center items-center transition-opacity",
            useFolderHoverChevron && "w-full h-full",
            useFolderHoverChevron && "group-hover:opacity-0"
          )}
        >
          {icon()}
        </div>
        {useFolderHoverChevron && (
          <div
            className={cn(
              "absolute inset-0 hidden group-hover:flex justify-center items-center cursor-pointer rounded-sm",
              ITEM_TYPE_CONTAINER_SIZE_CLASS[size]
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onClick={handleChevronClick}
          >
            <CaretDownIcon
              className={iconSizeClass}
              style={{
                transform: row.isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
