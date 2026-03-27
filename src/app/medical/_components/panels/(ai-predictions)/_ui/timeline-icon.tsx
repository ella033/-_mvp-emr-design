"use client";

import React from "react";
import {
  LineMedicineIcon,
  LineInjectionIcon,
  LineExamIcon,
  LineRadiationIcon,
  LineTreatmentIcon,
  LineTreatmentMaterialIcon,
} from "@/components/custom-icons";
import { cn } from "@/lib/utils";

export type TimelineItemType =
  | "drug"
  | "injection"
  | "exam"
  | "xray"
  | "treatment"
  | "material";

interface TimelineIconProps {
  type: TimelineItemType;
  size?: number;
  className?: string;
}

const ICON_COLOR = "text-[#46474C]";

/** CSS variable used as background — same as item-type.tsx IconContainer */
const BLUE_BG = "bg-[var(--blue-1)]";
const RED_BG = "bg-[var(--red-1)]";

const ICON_CONFIG: Record<
  TimelineItemType,
  { icon: React.ElementType; bg: string; bgVar: string; label: string; dotColor: string }
> = {
  drug: {
    icon: LineMedicineIcon,
    bg: BLUE_BG,
    bgVar: "var(--blue-1)",
    label: "투약",
    dotColor: "#3b82f6",
  },
  injection: {
    icon: LineInjectionIcon,
    bg: BLUE_BG,
    bgVar: "var(--blue-1)",
    label: "주사",
    dotColor: "#3b82f6",
  },
  exam: {
    icon: LineExamIcon,
    bg: RED_BG,
    bgVar: "var(--red-1)",
    label: "검사",
    dotColor: "#ef4444",
  },
  xray: {
    icon: LineRadiationIcon,
    bg: RED_BG,
    bgVar: "var(--red-1)",
    label: "X-ray",
    dotColor: "#ef4444",
  },
  treatment: {
    icon: LineTreatmentIcon,
    bg: BLUE_BG,
    bgVar: "var(--blue-1)",
    label: "처치",
    dotColor: "#3b82f6",
  },
  material: {
    icon: LineTreatmentMaterialIcon,
    bg: BLUE_BG,
    bgVar: "var(--blue-1)",
    label: "재료",
    dotColor: "#3b82f6",
  },
};

export function TimelineIcon({ type, size = 14, className }: TimelineIconProps) {
  const config = ICON_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full p-0.5",
        config.bg,
        className,
      )}
      title={config.label}
    >
      <Icon className={cn(ICON_COLOR)} style={{ width: size, height: size }} />
    </div>
  );
}

export function TimelineIconLegend() {
  return null;
}

export { ICON_CONFIG, ICON_COLOR };
