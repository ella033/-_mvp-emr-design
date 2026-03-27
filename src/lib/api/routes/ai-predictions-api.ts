export const aiPredictionsApi = {
  get: (type: string, scopeType: string, scopeId: string) =>
    `/ai-predictions/${type}/${scopeType}/${scopeId}`,
  regenerate: (type: string, scopeType: string, scopeId: string) =>
    `/ai-predictions/${type}/${scopeType}/${scopeId}/regenerate`,
  realtimeSymptomDisease: '/ai-predictions/realtime/symptom-disease',
};
