import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AiPredictionsService } from "@/services/ai-predictions-service";
import { AI_PREDICTION_STATUS } from "@/types/chart/ai-prediction-types";

// ── 범용 훅 ──
export function useAiPrediction(
  type: string,
  scopeType: string,
  scopeId: string | undefined,
) {
  const query = useQuery({
    queryKey: ["ai-prediction", type, scopeType, scopeId],
    queryFn: () => AiPredictionsService.get(type, scopeType, scopeId!),
    enabled:
      !!scopeId &&
      !["undefined", "null", "0"].includes(scopeId),
    retry: false,
  });

  // status가 PENDING(0) 또는 AGGREGATED(1)이면 3초 폴링 (LLM 완료 대기)
  const isProcessing =
    query.data?.status === AI_PREDICTION_STATUS.PENDING ||
    query.data?.status === AI_PREDICTION_STATUS.AGGREGATED;

  useQuery({
    queryKey: ["ai-prediction", type, scopeType, scopeId, "poll"],
    queryFn: async () => {
      const result = await AiPredictionsService.get(
        type,
        scopeType,
        scopeId!,
      );
      if (
        result.status !== AI_PREDICTION_STATUS.PENDING &&
        result.status !== AI_PREDICTION_STATUS.AGGREGATED
      ) {
        query.refetch();
      }
      return result;
    },
    enabled: isProcessing && !!scopeId,
    refetchInterval: isProcessing ? 3000 : false,
  });

  return query;
}

// ── 편의 훅들 ──

/** 기존 호환: encounter_summary by registration */
export function useEncounterSummary(registrationId: string | undefined) {
  return useAiPrediction(
    "encounter_summary",
    "registration",
    registrationId,
  );
}

/** 만성질환 알림 by patient */
export function useChronicAlert(patientId: number | undefined) {
  return useAiPrediction(
    "chronic_alert",
    "patient",
    patientId ? String(patientId) : undefined,
  );
}

/** 청구 최적화 by encounter */
export function useClaimOptimize(encounterId: string | undefined) {
  return useAiPrediction("claim_optimize", "encounter", encounterId);
}

/** 재내원 예측 by registration */
export function useVisitPrediction(registrationId: string | undefined) {
  return useAiPrediction(
    "visit_prediction",
    "registration",
    registrationId,
  );
}

/** 자동 메모 by encounter */
export function useAutoMemo(encounterId: string | undefined) {
  return useAiPrediction("auto_memo", "encounter", encounterId);
}

// ── 재생성 mutation ──
export function useRegenerateAiPrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      scopeType,
      scopeId,
    }: {
      type: string;
      scopeType: string;
      scopeId: string;
    }) => AiPredictionsService.regenerate(type, scopeType, scopeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "ai-prediction",
          variables.type,
          variables.scopeType,
          variables.scopeId,
        ],
      });
    },
  });
}

// ── 기존 호환 훅들 ──
export function useEncounterSummaryByRegistration(
  registrationId: string | undefined,
) {
  return useEncounterSummary(registrationId);
}

export function useRegenerateEncounterSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      AiPredictionsService.regenerate(
        "encounter_summary",
        "registration",
        registrationId,
      ),
    onSuccess: (_data, registrationId) => {
      queryClient.invalidateQueries({
        queryKey: [
          "ai-prediction",
          "encounter_summary",
          "registration",
          registrationId,
        ],
      });
    },
  });
}

// ── 실시간: 증상→상병 추천 ──
export function useSymptomDiseaseSuggest() {
  return useMutation({
    mutationFn: ({
      symptom,
      patientAge,
      patientGender,
    }: {
      symptom: string;
      patientAge?: number;
      patientGender?: number;
    }) =>
      AiPredictionsService.realtimeSymptomDisease(
        symptom,
        patientAge,
        patientGender,
      ),
  });
}
