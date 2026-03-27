"use client";

import { Card, CardContent } from "@/components/ui/card";
import ClaimsDetailHeader from "./claims-detail-header";
import ClaimsRightDetail from "./claims-right-detail";
import { useClaimsDxStore } from "@/app/claims/(stores)/claims-dx-store";
import { ChevronRight } from "lucide-react";

type ClaimApiErrorItem =
  | string
  | {
    message?: string;
    raw?: string | { message?: string; raw?: string };
  };

const normalizeClaimApiErrorMessages = (
  claimApiErrors?: ClaimApiErrorItem[]
): string[] => {
  if (!Array.isArray(claimApiErrors)) return [];

  return claimApiErrors
    .map((errorItem) => {
      if (typeof errorItem === "string") return errorItem.trim();

      const rawObject =
        typeof errorItem.raw === "object" && errorItem.raw !== null
          ? errorItem.raw
          : undefined;

      const candidates = [
        errorItem.message,
        rawObject?.message,
        typeof errorItem.raw === "string" ? errorItem.raw : undefined,
        rawObject?.raw,
      ];

      return (
        candidates
          .map((candidate) => String(candidate ?? "").trim())
          .find((candidate) => candidate.length > 0) ?? ""
      );
    })
    .filter((message) => message.length > 0);
};

interface ClaimsDetailPanelProps {
  claimId: string;
  showHeader?: boolean;
  onPrevPatientAction?: () => void;
  onNextPatientAction?: () => void;
  canMovePrev?: boolean;
  canMoveNext?: boolean;
}

export default function ClaimsDetailPanel({
  claimId,
  showHeader = true,
  onPrevPatientAction,
  onNextPatientAction,
  canMovePrev = false,
  canMoveNext = false,
}: ClaimsDetailPanelProps) {
  const claimDetail = useClaimsDxStore((s) => s.claimDetail);

  if (!claimDetail) {
    return (
      <div
        className="h-full w-full flex items-center justify-center text-muted-foreground"
        data-testid="claims-detail-empty-state"
      >
        상세를 보려면 좌측 목록에서 명세서를 선택하세요.
      </div>
    );
  }

  const claimApiErrors = normalizeClaimApiErrorMessages(
    (claimDetail as any)?.claimApiErrors as ClaimApiErrorItem[] | undefined
  );
  const warningCount = Number(
    (claimDetail as any)?.errorCount ??
    (claimDetail as any)?.claimApiErrorCount ??
    claimApiErrors.length ??
    0
  );
  const hasWarning = warningCount > 0;

  const warningText = hasWarning
    ? "점검이 필요한 내역이 존재합니다. 수정 후 청구하시기 바랍니다."
    : "점검 오류가 없습니다.";

  return (
    <Card
      data-testid="claims-detail-panel"
      className="h-full p-0 bg-card shadow-none"
      style={{ borderRadius: 'var(--radius-6, 6px)' }}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {showHeader && (
          <div className="relative">
            <ClaimsDetailHeader
              claimId={String(claimId)}
              fallback={claimDetail}
              onPrevPatientAction={onPrevPatientAction}
              onNextPatientAction={onNextPatientAction}
              canMovePrev={canMovePrev}
              canMoveNext={canMoveNext}
            />
          </div>
        )}
        {hasWarning && (
          <>
            <div className="flex items-center gap-1.5 bg-[#FEECEC] px-4 py-1.5">
              <img src="/icon/ic_line_alert-circle.svg" alt="" className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-[14px] font-medium leading-[30px] text-[var(--gray-100)] underline">{warningText}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--gray-200)]" />
            </div>
            {claimApiErrors.length > 0 && (
              <div className="bg-[var(--red-1)] px-3 pb-2">
                <ul className="list-disc space-y-1 pl-5 text-[12px] text-[#7F1D1D]">
                  {claimApiErrors.map((errorMessage, index) => (
                    <li key={`claim-api-error-${index}`}>{errorMessage}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <div className="flex-1 min-h-0 overflow-auto">
          <ClaimsRightDetail />
        </div>
      </CardContent>
    </Card>
  );
}
