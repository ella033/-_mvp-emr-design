"use client";

import { useChronicAlertLogic } from "./_logic/hooks/use-chronic-alert";
import { ChronicAlertView } from "./_ui/chronic-alert-view";

interface ChronicAlertCardProps {
  patientId: number | undefined;
}

export function ChronicAlertCard({ patientId }: ChronicAlertCardProps) {
  const viewProps = useChronicAlertLogic(patientId);
  return <ChronicAlertView {...viewProps} />;
}
