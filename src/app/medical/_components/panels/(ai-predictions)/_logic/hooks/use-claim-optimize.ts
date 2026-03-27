import { useClaimOptimize as useClaimOptimizeQuery } from "@/hooks/encounter/use-ai-prediction";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";
import type { ClaimOptimizeResult } from "@/types/chart/ai-prediction-types";
import type { ClaimOptimizeViewProps } from "../types";

export function useClaimOptimizeLogic(encounterId: string | undefined): ClaimOptimizeViewProps {
  const { data, isLoading } = useClaimOptimizeQuery(encounterId);

  const isAggregating =
    !isLoading &&
    !!data &&
    data.status === AI_PREDICTION_STATUS.AGGREGATED;

  const isComplete =
    !!data && data.status >= AI_PREDICTION_STATUS.COMPLETE;

  const result = isComplete ? (data.result as ClaimOptimizeResult | null) : null;

  return { isLoading, isAggregating, result };
}
