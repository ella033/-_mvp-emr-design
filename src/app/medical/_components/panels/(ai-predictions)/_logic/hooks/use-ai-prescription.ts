import { useState, useEffect, useMemo, useCallback } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import { useEncounterStore } from "@/store/encounter-store";
import { searchAndConvert } from "../utils/to-order-base";
import type { EncounterSummaryResult } from "@/types/chart/ai-prediction-types";
import type { AiPrescriptionViewProps } from "../types";

/** 진찰료 코드 판별 (AA로 시작) */
function isConsultationCode(code?: string): boolean {
  return !!code && code.startsWith("AA");
}

interface UseAiPrescriptionArgs {
  prediction: EncounterSummaryResult;
}

export function useAiPrescriptionLogic({ prediction }: UseAiPrescriptionArgs): AiPrescriptionViewProps {
  const { info, warning } = useToastHelpers();
  const setNewOrders = useEncounterStore((s) => s.setNewOrders);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const prescriptionItems = useMemo(() => {
    const items = prediction.todayPredictedItems ?? [];
    return items.filter((item) => !isConsultationCode(item.code));
  }, [prediction.todayPredictedItems]);

  useEffect(() => {
    if (prescriptionItems.length) {
      setCheckedItems(new Set(prescriptionItems.map((_, idx) => idx)));
    }
  }, [prescriptionItems]);

  const onToggle = useCallback((idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const onApply = useCallback(async () => {
    if (!prescriptionItems.length) return;

    const checkedItemsList = prescriptionItems.filter((_, idx) => checkedItems.has(idx));
    if (!checkedItemsList.length) {
      warning("선택된 항목이 없습니다");
      return;
    }

    setIsApplying(true);
    try {
      const orders = await searchAndConvert(checkedItemsList);
      if (orders.length > 0) {
        setNewOrders(orders);
        info(`${orders.length}건 처방이 추가되었습니다`);
      } else {
        warning("매칭되는 처방을 찾지 못했습니다");
      }
    } catch {
      warning("처방 추가 중 오류가 발생했습니다");
    } finally {
      setIsApplying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prescriptionItems, checkedItems]);

  return {
    prescriptionItems,
    warnings: prediction.warnings ?? [],
    summaryText: prediction.summaryText,
    checkedItems,
    isApplying,
    onToggle,
    onApply,
  };
}
