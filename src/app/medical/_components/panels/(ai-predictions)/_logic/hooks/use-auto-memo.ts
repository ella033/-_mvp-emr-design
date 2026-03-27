import { useAutoMemo as useAutoMemoQuery } from "@/hooks/encounter/use-ai-prediction";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";
import type { AutoMemoResult } from "@/types/chart/ai-prediction-types";
import type { AutoMemoViewProps } from "../types";

export function useAutoMemoLogic(encounterId: string | undefined): AutoMemoViewProps {
  const { data, isLoading } = useAutoMemoQuery(encounterId);

  const isAggregating =
    !isLoading &&
    !!data &&
    data.status === AI_PREDICTION_STATUS.AGGREGATED;

  const isComplete =
    !!data && data.status >= AI_PREDICTION_STATUS.COMPLETE;

  const result = isComplete ? (data.result as AutoMemoResult | null) : null;

  return { isLoading, isAggregating, result };
}
