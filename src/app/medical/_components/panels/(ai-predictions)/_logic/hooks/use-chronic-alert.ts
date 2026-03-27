import { useChronicAlert as useChronicAlertQuery } from "@/hooks/encounter/use-ai-prediction";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";
import type { ChronicAlertResult } from "@/types/chart/ai-prediction-types";
import type { ChronicAlertViewProps } from "../types";

export function useChronicAlertLogic(patientId: number | undefined): ChronicAlertViewProps {
  const { data, isLoading } = useChronicAlertQuery(patientId);

  const isAggregating =
    !isLoading &&
    !!data &&
    data.status === AI_PREDICTION_STATUS.AGGREGATED;

  const isComplete =
    !!data && data.status >= AI_PREDICTION_STATUS.COMPLETE;

  const result = isComplete ? (data.result as ChronicAlertResult | null) : null;

  return { isLoading, isAggregating, result };
}
