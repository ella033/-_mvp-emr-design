"use client";

import React from "react";
import { NoneSelectedPatient } from "../../widgets/none-patient";
import { usePredictionsPanel } from "./_logic/hooks/use-predictions-panel";
import { PredictionsPanelView } from "./_ui/predictions-panel-view";
import { AiPredictionCard } from "./ai-prediction-card";
import { SymptomDiseaseCard } from "./symptom-disease-card";
import { ConsultationCard } from "./consultation-card";
import { VisitPredictionCard } from "./visit-prediction-card";
import { AutoMemoCard } from "./auto-memo-card";
import { ChronicAlertCard } from "./chronic-alert-card";
import { ClaimOptimizeCard } from "./claim-optimize-card";

export default function AiPredictionsPanel() {
  const panel = usePredictionsPanel();

  if (!panel.hasPatient) {
    return <NoneSelectedPatient />;
  }

  if (!panel.isLoading && !panel.isError && !panel.isComplete && !panel.isPending && !panel.isAggregated && !panel.isErrorStatus) {
    return null;
  }

  // Build child card slots
  const prescriptionCard = panel.aiRecommendation ? (
    <AiPredictionCard prediction={panel.aiRecommendation} />
  ) : null;

  const symptomDiseaseCard =
    (panel.isAggregated || panel.isComplete) && panel.structuredSummary ? (
      <SymptomDiseaseCard
        rankedDiseases={panel.aiRecommendation?.rankedDiseases}
        diseaseHistory={panel.structuredSummary.diseaseHistory}
      />
    ) : (
      <SymptomDiseaseCard />
    );

  const consultationCard =
    panel.isComplete && panel.aiRecommendation ? (
      <ConsultationCard
        items={(panel.aiRecommendation.todayPredictedItems ?? []).filter(
          (item) => !!item.code && item.code.startsWith("AA"),
        )}
      />
    ) : null;

  return (
    <PredictionsPanelView
      isLoading={panel.isLoading}
      isError={panel.isError}
      is404={panel.is404}
      isPending={panel.isPending}
      isAggregated={panel.isAggregated}
      isComplete={panel.isComplete}
      isErrorStatus={panel.isErrorStatus}
      isRegenerating={panel.isRegenerating}
      errorMessage={panel.errorMessage ?? undefined}
      createDateTime={panel.createDateTime}
      modalOpen={panel.modalOpen}
      structuredSummary={panel.structuredSummary}
      aiRecommendation={panel.aiRecommendation}
      onOpenModal={panel.onOpenModal}
      onCloseModal={panel.onCloseModal}
      onRegenerate={panel.onRegenerate}
      prescriptionCard={prescriptionCard}
      symptomDiseaseCard={symptomDiseaseCard}
      consultationCard={consultationCard}
      visitPredictionCard={<VisitPredictionCard registrationId={panel.registrationId} />}
      autoMemoCard={<AutoMemoCard encounterId={panel.encounterId} />}
      chronicAlertCard={<ChronicAlertCard patientId={panel.patientId} />}
      claimOptimizeCard={<ClaimOptimizeCard encounterId={panel.encounterId} />}
    />
  );
}
