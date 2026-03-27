"use client";

import { useSymptomDiseaseLogic } from "./_logic/hooks/use-symptom-disease";
import { SymptomDiseaseView } from "./_ui/symptom-disease-view";
import type { RankedDisease, DiseaseHistoryEntry } from "@/types/chart/ai-prediction-types";

interface SymptomDiseaseCardProps {
  rankedDiseases?: RankedDisease[];
  diseaseHistory?: DiseaseHistoryEntry[];
  animateIcon?: boolean;
}

export function SymptomDiseaseCard({ rankedDiseases, diseaseHistory, animateIcon }: SymptomDiseaseCardProps) {
  const viewProps = useSymptomDiseaseLogic({ rankedDiseases, diseaseHistory });
  return <SymptomDiseaseView {...viewProps} animateIcon={animateIcon} />;
}
