"use client";

import { useAutoMemoLogic } from "./_logic/hooks/use-auto-memo";
import { AutoMemoView } from "./_ui/auto-memo-view";

interface AutoMemoCardProps {
  encounterId: string | undefined;
}

export function AutoMemoCard({ encounterId }: AutoMemoCardProps) {
  const viewProps = useAutoMemoLogic(encounterId);
  return <AutoMemoView {...viewProps} />;
}
