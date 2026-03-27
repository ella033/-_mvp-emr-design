"use client";

import { useConsultationLogic } from "./_logic/hooks/use-consultation";
import { ConsultationView } from "./_ui/consultation-view";

interface ConsultationCardProps {
  items: { code?: string; name: string; type: string; confidence: string; reason: string }[];
  animateIcon?: boolean;
}

export function ConsultationCard({ items, animateIcon }: ConsultationCardProps) {
  const viewProps = useConsultationLogic({ items });
  return <ConsultationView {...viewProps} animateIcon={animateIcon} />;
}
