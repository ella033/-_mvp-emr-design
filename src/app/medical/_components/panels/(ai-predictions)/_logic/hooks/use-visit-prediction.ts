import { useVisitPrediction as useVisitPredictionQuery } from "@/hooks/encounter/use-ai-prediction";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";
import type { VisitPredictionResult } from "@/types/chart/ai-prediction-types";
import type { VisitPredictionViewProps } from "../types";

export function useVisitPredictionLogic(registrationId: string | undefined): VisitPredictionViewProps {
  const { data, isLoading } = useVisitPredictionQuery(registrationId);

  const isAggregating =
    !isLoading &&
    !!data &&
    data.status === AI_PREDICTION_STATUS.AGGREGATED;

  const isComplete =
    !!data && data.status >= AI_PREDICTION_STATUS.COMPLETE;

  const result = isComplete ? (data.result as VisitPredictionResult | null) : null;

  return { isLoading, isAggregating, result };
}
