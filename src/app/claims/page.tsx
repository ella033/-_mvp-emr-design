"use client";
import ClaimsGeneration from "./_components/claims-generation";
import ClaimsTrend from "./_components/claims-trend";
import { ConfirmProvider } from "./commons/confirm-provider";
import { Suspense } from "react";

export default function ClaimsPage() {
  return (
    <ConfirmProvider>
      <div className="w-full h-full box-border p-2 flex flex-col gap-2 bg-[var(--page-background)] overflow-hidden">
        <div
          className="flex-[6] min-h-0 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-1)] overflow-hidden"
          data-testid="claims-generation-area"
        >
          <Suspense fallback={null}>
            <ClaimsGeneration />
          </Suspense>
        </div>
        <div
          className="flex-[4] min-h-0 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-1)] overflow-hidden"
          data-testid="claims-trend-area"
        >
          <Suspense fallback={null}>
            <ClaimsTrend />
          </Suspense>
        </div>
      </div>
    </ConfirmProvider>
  );
}
