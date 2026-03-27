"use client";

import { useAiPrescriptionLogic } from "./_logic/hooks/use-ai-prescription";
import { AiPrescriptionView } from "./_ui/ai-prescription-view";
import type { EncounterSummaryResult } from "@/types/chart/ai-prediction-types";

interface AiPredictionCardProps {
  prediction: EncounterSummaryResult;
  onApplied?: () => void;
}

export function AiPredictionCard({ prediction }: AiPredictionCardProps) {
  const viewProps = useAiPrescriptionLogic({ prediction });
  return <AiPrescriptionView {...viewProps} />;
}
