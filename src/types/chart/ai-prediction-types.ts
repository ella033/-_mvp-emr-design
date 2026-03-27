// AI Prediction 범용 타입 정의

// ── Status ──
export const AI_PREDICTION_STATUS = {
  PENDING: 0,
  AGGREGATED: 1,
  COMPLETE: 2,
  ERROR: 3,
} as const;

// ── 범용 응답 타입 ──
export interface AiPredictionResponse {
  id: string;
  hospitalId: number;
  type: string;
  scopeType: string;
  scopeId: string;
  inputData: any;
  result: any;
  status: number;
  errorMessage?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  llmTokensUsed?: number | null;
  llmLatencyMs?: number | null;
  createDateTime: string;
  updateDateTime?: string | null;
}

// ── encounter_summary (기존 호환) ──
export interface StructuredSummary {
  generatedAt: string;
  patientInfo: {
    chronicDisease: ChronicDiseaseInfo;
    prohibitedDrugs: ProhibitedDrugInfo[];
  };
  timeline: TimelineEntry[];
  diseaseHistory: DiseaseHistoryEntry[];
  prescriptionHistory: PrescriptionHistoryEntry[];
  vitalSignTrends: VitalSignTrendEntry[];
  symptomMemoHistory: SymptomMemoEntry[];
  encounterStats: EncounterStats;
}

export interface ChronicDiseaseInfo {
  hypertension: boolean;
  diabetes: boolean;
  highCholesterol: boolean;
}

export interface ProhibitedDrugInfo {
  name: string;
  memo?: string;
}

export interface TimelineItem {
  type: 'drug' | 'injection' | 'exam' | 'xray' | 'treatment' | 'material';
  count: number;
  topItems: string[];
}

export interface TimelineEntry {
  date: string;
  items: TimelineItem[];
  diseases?: string[];
  diseaseItems?: Record<string, TimelineItem[]>;
}

export interface DiseaseHistoryEntry {
  code: string;
  name: string;
  isChronic: boolean;
  firstSeen: string;
  lastSeen: string;
  encounterCount: number;
}

export interface PrescriptionHistoryEntry {
  claimCode: string;
  name: string;
  type: number;
  lastPrescribed: string;
  totalEncounters: number;
  lastDose?: string;
  lastDays?: number;
  lastTimes?: number;
  lastUsage?: string;
}

export interface VitalSignMeasurementEntry {
  date: string;
  value: number;
}

export interface VitalSignTrendEntry {
  itemCode: string;
  itemName: string;
  unit?: string;
  measurements: VitalSignMeasurementEntry[];
  latestValue?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface SymptomMemoEntry {
  date: string;
  symptom?: string;
  memo?: string;
}

export interface EncounterStats {
  totalEncounters: number;
  dateRange: { from: string; to: string };
  lastVisitDate?: string;
  averageVisitInterval?: number;
}

// encounter_summary result
export interface RankedDisease {
  code: string;
  name: string;
}

export interface EncounterSummaryResult {
  todayPredictedItems: AiPredictedItem[];
  rankedDiseases?: RankedDisease[];
  summaryText: string;
  warnings: string[];
}

export interface AiPredictedItem {
  type: 'drug' | 'injection' | 'exam' | 'xray' | 'treatment' | 'material';
  name: string;
  code?: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// chronic_alert result
export interface ChronicAlertResult {
  alerts: ChronicAlertItem[];
  managementScore: number;
  summaryText: string;
}

export interface ChronicAlertItem {
  severity: 'high' | 'medium' | 'low';
  category: 'overdue_exam' | 'vital_trend' | 'medication_adjust' | 'follow_up';
  message: string;
  suggestedAction: string;
  relatedCode?: string;
}

// claim_optimize result
export interface ClaimOptimizeResult {
  issues: ClaimIssueItem[];
  estimatedRisk: 'high' | 'medium' | 'low';
  summaryText: string;
}

export interface ClaimIssueItem {
  severity: 'error' | 'warning' | 'info';
  category: 'missing_code' | 'mismatch' | 'missing_surcharge' | 'duplicate';
  message: string;
  suggestedFix?: string;
}

// visit_prediction result
export interface VisitPredictionResult {
  predictedNextVisit: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  suggestAppointment: boolean;
  prescriptionEndDate?: string;
}

// auto_memo result
export interface AutoMemoResult {
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  fullText: string;
}

// symptom_disease (실시간)
export interface SymptomDiseaseResult {
  suggestions: SymptomDiseaseSuggestion[];
}

export interface SymptomDiseaseSuggestion {
  code: string;
  name: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// ── 기존 호환: EncounterSummary 타입 (AiPredictionResponse 래핑) ──
export interface EncounterSummary {
  id: string;
  registrationId: string;
  hospitalId: number;
  patientId: number;
  structuredSummary: StructuredSummary;
  aiRecommendation: EncounterSummaryResult | null;
  status: number;
  errorMessage?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  llmTokensUsed?: number | null;
  llmLatencyMs?: number | null;
  createDateTime: string;
  updateDateTime?: string | null;
}

// 기존 호환
export const ENCOUNTER_SUMMARY_STATUS = AI_PREDICTION_STATUS;
export type AiPrediction = EncounterSummaryResult;
