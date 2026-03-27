"use client";

import { useVisitPredictionLogic } from "./_logic/hooks/use-visit-prediction";
import { VisitPredictionView } from "./_ui/visit-prediction-view";

interface VisitPredictionCardProps {
  registrationId: string | undefined;
}

export function VisitPredictionCard({ registrationId }: VisitPredictionCardProps) {
  const viewProps = useVisitPredictionLogic(registrationId);
  return <VisitPredictionView {...viewProps} />;
}
