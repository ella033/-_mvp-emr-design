import { useEffect, useRef, useState, useCallback } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import { useEncounterStore } from "@/store/encounter-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { useSymptomDiseaseSuggest } from "@/hooks/encounter/use-ai-prediction";
import { calculateAge } from "../utils/calculate-age";
import type { RankedDisease, DiseaseHistoryEntry } from "@/types/chart/ai-prediction-types";
import type { SymptomDiseaseViewProps } from "../types";

interface UseSymptomDiseaseArgs {
  rankedDiseases?: RankedDisease[];
  diseaseHistory?: DiseaseHistoryEntry[];
}

export function useSymptomDiseaseLogic({
  rankedDiseases,
  diseaseHistory,
}: UseSymptomDiseaseArgs): Omit<SymptomDiseaseViewProps, "animateIcon"> {
  const draftSymptom = useEncounterStore((s) => s.draftSymptom);
  const setNewDiseases = useEncounterStore((s) => s.setNewDiseases);
  const patient = useReceptionStore((s) => s.currentRegistration?.patient);

  const { info } = useToastHelpers();
  const mutation = useSymptomDiseaseSuggest();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set([0]));

  const symptomText = draftSymptom.trim();

  // 500ms debounce on draftSymptom changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!symptomText) return;

    timerRef.current = setTimeout(() => {
      mutation.mutate({
        symptom: symptomText,
        patientAge: calculateAge(patient?.birthDate),
        patientGender: patient?.gender ?? undefined,
      });
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symptomText]);

  const suggestions = mutation.data?.suggestions as
    | Array<{ code: string; name: string; confidence: string; reason: string }>
    | undefined;

  // suggestions가 바뀌면 1위만 자동 체크
  useEffect(() => {
    setCheckedItems(new Set([0]));
  }, [suggestions, rankedDiseases, diseaseHistory]);

  // fallback 순서: rankedDiseases(AI) → diseaseHistory(이력) 상위 5개
  const fallbackDiseases: RankedDisease[] | undefined =
    rankedDiseases && rankedDiseases.length > 0
      ? rankedDiseases.slice(0, 5)
      : diseaseHistory && diseaseHistory.length > 0
        ? diseaseHistory.slice(0, 5).map((d) => ({ code: d.code, name: d.name }))
        : undefined;
  const hasFallback = fallbackDiseases && fallbackDiseases.length > 0;
  const showFallback = hasFallback && !suggestions?.length && !mutation.isPending;

  const onToggle = useCallback((idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const onApply = useCallback(() => {
    if (suggestions?.length) {
      const checked = suggestions.filter((_, idx) => checkedItems.has(idx));
      if (checked.length > 0) {
        setNewDiseases(checked.map((s) => ({ code: s.code, name: s.name })));
        info(`${checked.length}건 상병이 추가되었습니다`);
      }
      return;
    }
    if (hasFallback) {
      const checked = fallbackDiseases!.filter((_, idx) => checkedItems.has(idx));
      if (checked.length > 0) {
        setNewDiseases(checked.map((d) => ({ code: d.code, name: d.name })));
        info(`${checked.length}건 상병이 추가되었습니다`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, fallbackDiseases, checkedItems, hasFallback]);

  const hasItems = (suggestions?.length ?? 0) > 0 || !!showFallback;

  return {
    suggestions,
    fallbackDiseases,
    showFallback: !!showFallback,
    isPending: mutation.isPending,
    symptomText,
    checkedItems,
    hasItems,
    onToggle,
    onApply,
  };
}
