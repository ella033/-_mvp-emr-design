import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { useVitalSignSubItems } from "@/hooks/vital-sign-sub-items/use-vital-sign-sub-items";
import { useMemo } from "react";

interface VitalSignItemCardProps {
  item: VitalSignItem;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function VitalSignItemCard({
  item,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: VitalSignItemCardProps) {
  const { data: subItems = [] } = useVitalSignSubItems(item.id);

  // 정상 범위 표시 (item 자체)
  const normalRange =
    item.normalMinValue !== undefined &&
    item.normalMinValue !== null &&
    item.normalMaxValue !== undefined &&
    item.normalMaxValue !== null
      ? `${item.normalMinValue} ~ ${item.normalMaxValue}`
      : item.normalMinValue !== undefined && item.normalMinValue !== null
        ? `≥ ${item.normalMinValue}`
        : item.normalMaxValue !== undefined && item.normalMaxValue !== null
          ? `≤ ${item.normalMaxValue}`
          : null;

  // subItem 정상범위 표시: (code: min~max, code2: min~max ...)
  const subItemRangeText = useMemo(() => {
    const parts = subItems
      .filter((sub) => sub.code && sub.code.trim() !== "" && sub.code !== "N/A")
      .filter(
        (sub) =>
          (sub.normalMinValue !== undefined && sub.normalMinValue !== null) ||
          (sub.normalMaxValue !== undefined && sub.normalMaxValue !== null)
      )
      .map((sub) => {
        const min = sub.normalMinValue;
        const max = sub.normalMaxValue;
        const range =
          min != null && max != null
            ? `${min}~${max}`
            : min != null
              ? `≥${min}`
              : `≤${max}`;
        return `${sub.code}: ${range}`;
      });
    return parts.length > 0 ? `(${parts.join(", ")})` : null;
  }, [subItems]);

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
        "border border-[var(--border-1)] bg-[var(--bg-primary)]",
        "hover:bg-[var(--bg-secondary)]",
        isSelected && "bg-[var(--bg-tertiary)] border-[var(--primary)]",
        isDragging && "opacity-50"
      )}
    >
      <GripVertical className="w-4 h-4 text-[var(--text-tertiary)] cursor-grab" />
      <div className="flex flex-1 flex-row gap-2 items-center">
        <span className="text-[13px] ">{item.name}</span>
        {normalRange && (
          <span className="text-xs text-[var(--text-tertiary)]">
            정상범위 : {normalRange}
          </span>
        )}
        {subItemRangeText && (
          <span className="text-xs text-[var(--text-tertiary)]">
            {subItemRangeText}
          </span>
        )}
      </div>
      {item.unit && (
        <span className="text-xs text-[var(--text-secondary)]">
          ({item.unit})
        </span>
      )}
    </div>
  );
}
