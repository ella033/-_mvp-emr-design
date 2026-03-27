import { useState, useEffect, useCallback } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import { useEncounterStore } from "@/store/encounter-store";
import { PrescriptionType } from "@/constants/master-data-enum";
import { searchAndConvert } from "../utils/to-order-base";
import type { ConsultationViewProps } from "../types";

interface UseConsultationArgs {
  items: { code?: string; name: string; type: string; confidence: string; reason: string }[];
}

export function useConsultationLogic({ items }: UseConsultationArgs): Omit<ConsultationViewProps, "animateIcon"> {
  const { info, warning } = useToastHelpers();
  const setNewOrders = useEncounterStore((s) => s.setNewOrders);
  const [isApplying, setIsApplying] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (items.length) {
      setCheckedItems(new Set(items.map((_, idx) => idx)));
    }
  }, [items]);

  const onToggle = useCallback((idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const onApply = useCallback(async () => {
    const checkedItemsList = items.filter((_, idx) => checkedItems.has(idx));
    if (!checkedItemsList.length) {
      warning("선택된 항목이 없습니다");
      return;
    }

    setIsApplying(true);
    try {
      const orders = await searchAndConvert(checkedItemsList, PrescriptionType.medical);
      if (orders.length > 0) {
        setNewOrders(orders);
        info(`${orders.length}건 진찰료가 추가되었습니다`);
      } else {
        warning("매칭되는 진찰료를 찾지 못했습니다");
      }
    } catch {
      warning("진찰료 추가 중 오류가 발생했습니다");
    } finally {
      setIsApplying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, checkedItems]);

  return { items, checkedItems, isApplying, onToggle, onApply };
}
