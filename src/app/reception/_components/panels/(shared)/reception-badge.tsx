import { useMemo } from "react";
import type { Order } from "@/types/chart/order-types";
import { InputType } from "@/types/chart/order-types";
import { getPrescriptionDetailTypes, 처방상세구분 } from "@/types/master-data/item-type";
import type { Encounter } from "@/types/chart/encounter-types";

interface PrescriptionBadgesProps {
  encounter: Encounter | null | undefined;
  /** 뱃지 크기 (기본 "md": w-6 h-6, "sm": w-5 h-5) */
  size?: "sm" | "md";
}

/**
 * 처방 뱃지 (검/주/증/메)
 * - 검사, 주사, 재증명, 지시오더 여부에 따라 뱃지 표시
 */
export function PrescriptionBadges({ encounter, size = "md" }: PrescriptionBadgesProps) {
  const badges = useMemo(() => {
    if (!encounter?.orders) return null;

    const orders = encounter.orders;
    const prescriptionDetailTypes = getPrescriptionDetailTypes(orders);
    const has검사 = prescriptionDetailTypes.includes(처방상세구분.검사);
    const has주사 = prescriptionDetailTypes.includes(처방상세구분.주사);
    //todo 완료 여부 체크 필요
    const done검사 = true;
    const done주사 = true;
    const has지시오더 = orders.some((order: Order) => order.inputType === InputType.지시오더);
    const has재증명 = orders.some((order: Order) => order.itemType.startsWith("12"));

    const hasBadges = has검사 || has주사 || has재증명 || has지시오더;
    if (!hasBadges) return null;

    const sizeClass = size === "sm" ? "w-5 h-5" : "w-6 h-6";
    const baseClassName = `${sizeClass} flex items-center justify-center rounded font-medium`;
    const doneClassName = `bg-[var(--bg-1)] text-[var(--gray-300)] border border-[var(--border-1)] ${baseClassName}`;
    const notDoneClassName = `border border-[var(--blue-1)] text-[var(--blue-2)] font-semibold ${baseClassName}`;

    return (
      <div className="flex gap-1 items-center text-[12px]">
        {has검사 && <div className={done검사 ? doneClassName : notDoneClassName}>검</div>}
        {has주사 && <div className={done주사 ? doneClassName : notDoneClassName}>주</div>}
        {has재증명 && <div className={`bg-[var(--lime-1)] text-[var(--color-picker-Green-1)] font-semibold ${baseClassName}`}>증</div>}
        {has지시오더 && <div className={`bg-[var(--yellow-4)] text-[var(--color-picker-Orange-1)] ${baseClassName}`}>메</div>}
      </div>
    );
  }, [encounter, size]);

  return badges;
}
