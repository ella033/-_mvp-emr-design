import { ApiClient } from "@/lib/api/api-client";
import { aiPredictionsApi } from "@/lib/api/routes/ai-predictions-api";
import type { AiPredictionResponse } from "@/types/chart/ai-prediction-types";

export class AiPredictionsService {
  static async get(
    type: string,
    scopeType: string,
    scopeId: string,
  ): Promise<AiPredictionResponse> {
    return await ApiClient.get<AiPredictionResponse>(
      aiPredictionsApi.get(type, scopeType, scopeId),
      undefined,
      { timeout: 30000 },
    );
  }

  static async regenerate(
    type: string,
    scopeType: string,
    scopeId: string,
  ): Promise<{ success: boolean }> {
    return await ApiClient.post<{ success: boolean }>(
      aiPredictionsApi.regenerate(type, scopeType, scopeId),
      {},
      { timeout: 60000 },
    );
  }

  static async realtimeSymptomDisease(
    symptom: string,
    patientAge?: number,
    patientGender?: number,
  ): Promise<any> {
    return await ApiClient.post(
      aiPredictionsApi.realtimeSymptomDisease,
      { symptom, patientAge, patientGender },
    );
  }
}
