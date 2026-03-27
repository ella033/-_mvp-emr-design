import type { ReactNode } from "react";
import type {
  AutoMemoResult,
  ChronicAlertResult,
  ClaimOptimizeResult,
  VisitPredictionResult,
  RankedDisease,
  EncounterSummaryResult,
  StructuredSummary,
} from "@/types/chart/ai-prediction-types";

/* ─── AutoMemo ─── */
export interface AutoMemoViewProps {
  isLoading: boolean;
  isAggregating: boolean;
  result: AutoMemoResult | null;
}

/* ─── VisitPrediction ─── */
export interface VisitPredictionViewProps {
  isLoading: boolean;
  isAggregating: boolean;
  result: VisitPredictionResult | null;
}

/* ─── ChronicAlert ─── */
export interface ChronicAlertViewProps {
  isLoading: boolean;
  isAggregating: boolean;
  result: ChronicAlertResult | null;
}

/* ─── ClaimOptimize ─── */
export interface ClaimOptimizeViewProps {
  isLoading: boolean;
  isAggregating: boolean;
  result: ClaimOptimizeResult | null;
}

/* ─── Consultation ─── */
export interface ConsultationViewProps {
  items: { code?: string; name: string; type: string; confidence: string; reason: string }[];
  checkedItems: Set<number>;
  isApplying: boolean;
  animateIcon?: boolean;
  onToggle: (idx: number) => void;
  onApply: () => void;
}

/* ─── AiPrescription ─── */
export interface AiPrescriptionViewProps {
  prescriptionItems: { code?: string; name: string; type: string; confidence: string; reason: string }[];
  warnings: string[];
  summaryText?: string;
  checkedItems: Set<number>;
  isApplying: boolean;
  onToggle: (idx: number) => void;
  onApply: () => void;
}

/* ─── SymptomDisease ─── */
export interface SymptomDiseaseViewProps {
  suggestions: { code: string; name: string; confidence: string; reason: string }[] | undefined;
  fallbackDiseases: RankedDisease[] | undefined;
  showFallback: boolean;
  isPending: boolean;
  symptomText: string;
  checkedItems: Set<number>;
  hasItems: boolean;
  animateIcon?: boolean;
  onToggle: (idx: number) => void;
  onApply: () => void;
}

/* ─── PredictionsPanel ─── */
export interface PredictionsPanelViewProps {
  isLoading: boolean;
  isError: boolean;
  is404: boolean;
  isPending: boolean;
  isAggregated: boolean;
  isComplete: boolean;
  isErrorStatus: boolean;
  isRegenerating: boolean;
  errorMessage?: string;
  createDateTime?: string;
  modalOpen: boolean;
  structuredSummary: StructuredSummary | null;
  aiRecommendation: EncounterSummaryResult | null;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onRegenerate: () => void;
  /* Card slots rendered by the Container */
  prescriptionCard: ReactNode;
  symptomDiseaseCard: ReactNode;
  consultationCard: ReactNode;
  visitPredictionCard: ReactNode;
  autoMemoCard: ReactNode;
  /* Modal-only cards */
  chronicAlertCard: ReactNode;
  claimOptimizeCard: ReactNode;
}
