import { useState, useCallback } from "react";
import {
  useEncounterSummaryByRegistration,
  useRegenerateEncounterSummary,
} from "@/hooks/encounter/use-ai-prediction";
import { useReceptionStore } from "@/store/common/reception-store";
import { useEncounterStore } from "@/store/encounter-store";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";
import type { EncounterSummaryResult, StructuredSummary } from "@/types/chart/ai-prediction-types";

export function usePredictionsPanel() {
  const selectedEncounter = useEncounterStore((state) => state.selectedEncounter);
  const currentRegistration = useReceptionStore((state) => state.currentRegistration);

  const registrationId = selectedEncounter?.registrationId ?? currentRegistration?.id;
  const patientId = selectedEncounter?.patientId ?? currentRegistration?.patientId;
  const encounterId = selectedEncounter?.id;

  const [modalOpen, setModalOpen] = useState(false);

  const { data: summary, isLoading, error, isError } =
    useEncounterSummaryByRegistration(registrationId);

  const regenerateMutation = useRegenerateEncounterSummary();

  const hasPatient = !!(selectedEncounter || currentRegistration);

  const handleRegenerate = useCallback(() => {
    if (registrationId) {
      regenerateMutation.mutate(registrationId);
    }
  }, [registrationId, regenerateMutation]);

  const onOpenModal = useCallback(() => setModalOpen(true), []);
  const onCloseModal = useCallback(() => setModalOpen(false), []);

  const isPending = summary?.status === AI_PREDICTION_STATUS.PENDING;
  const isAggregated = summary?.status === AI_PREDICTION_STATUS.AGGREGATED;
  const isComplete = summary?.status === AI_PREDICTION_STATUS.COMPLETE;
  const isErrorStatus = summary?.status === AI_PREDICTION_STATUS.ERROR;
  const isRegenerating =
    (regenerateMutation.isPending && regenerateMutation.variables === registrationId) ||
    isPending ||
    isAggregated;

  const structuredSummary = summary?.inputData as StructuredSummary | null ?? null;
  const aiRecommendation = summary?.result as EncounterSummaryResult | null ?? null;

  return {
    hasPatient,
    registrationId,
    patientId,
    encounterId,
    isLoading,
    isError,
    is404: isError && (error as any)?.status === 404,
    isPending: !!isPending,
    isAggregated: !!isAggregated,
    isComplete: !!isComplete,
    isErrorStatus: !!isErrorStatus,
    isRegenerating: !!isRegenerating,
    errorMessage: summary?.errorMessage,
    createDateTime: summary?.createDateTime,
    modalOpen,
    structuredSummary,
    aiRecommendation,
    onOpenModal,
    onCloseModal,
    onRegenerate: handleRegenerate,
  };
}
