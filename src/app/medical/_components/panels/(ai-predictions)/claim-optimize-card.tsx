"use client";

import { useClaimOptimizeLogic } from "./_logic/hooks/use-claim-optimize";
import { ClaimOptimizeView } from "./_ui/claim-optimize-view";

interface ClaimOptimizeCardProps {
  encounterId: string | undefined;
}

export function ClaimOptimizeCard({ encounterId }: ClaimOptimizeCardProps) {
  const viewProps = useClaimOptimizeLogic(encounterId);
  return <ClaimOptimizeView {...viewProps} />;
}
