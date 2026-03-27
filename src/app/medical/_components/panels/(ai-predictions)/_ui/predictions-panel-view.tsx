"use client";

import React from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Loader2, AlertCircle, UserPlus, Maximize2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { EncounterTimeline } from "./encounter-timeline";
import { SummaryText } from "./summary-text";
import { VitalTrendChart } from "./vital-trend-chart";
import type { PredictionsPanelViewProps } from "./_contracts/view-props";

export function PredictionsPanelView({
  isLoading,
  isError,
  is404,
  isPending,
  isAggregated,
  isComplete,
  isErrorStatus,
  isRegenerating,
  errorMessage,
  createDateTime,
  modalOpen,
  structuredSummary,
  aiRecommendation,
  onOpenModal,
  onCloseModal,
  onRegenerate,
  prescriptionCard,
  symptomDiseaseCard,
  consultationCard,
  visitPredictionCard,
  autoMemoCard,
  chronicAlertCard,
  claimOptimizeCard,
}: PredictionsPanelViewProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-2 space-y-4 text-sm">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-xs">AI 분석 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // No summary found (404)
  if (is404) {
    return (
      <div className="h-full overflow-y-auto p-2 space-y-4 text-sm">
        {symptomDiseaseCard}
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <UserPlus size={20} />
          <span className="text-xs">신환 — 이전 진료이력이 없습니다</span>
          <button
            onClick={onRegenerate}
            className="text-[10px] text-primary hover:underline"
          >
            AI 분석 시작
          </button>
        </div>
      </div>
    );
  }

  // Other error
  if (isError) {
    return (
      <div className="h-full overflow-y-auto p-2 space-y-4 text-sm">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-xs">AI 분석 로딩 실패</span>
          <button
            onClick={onRegenerate}
            className="text-[10px] text-primary hover:underline"
          >
            재시도
          </button>
        </div>
      </div>
    );
  }

  // Modal-only detail cards
  const detailCards = (
    <>
      {(isAggregated || isComplete) && structuredSummary && (
        <EncounterTimeline
          timeline={structuredSummary.timeline ?? []}
          aiPrediction={isComplete ? aiRecommendation : null}
          diseaseHistory={structuredSummary.diseaseHistory}
          rankedDiseases={aiRecommendation?.rankedDiseases}
        />
      )}

      {(isAggregated || isComplete) && structuredSummary && (
        <div className="space-y-1.5">
          <div className="text-sm font-semibold text-foreground">
            진료이력 요약
          </div>
          <div className="border rounded-md p-2 space-y-2 bg-muted/20">
            <SummaryText summary={structuredSummary} />
            {structuredSummary.vitalSignTrends?.length > 0 && (
              <VitalTrendChart trends={structuredSummary.vitalSignTrends} />
            )}
          </div>
        </div>
      )}

      {chronicAlertCard}
      {claimOptimizeCard}
    </>
  );

  const header = (
    <div className="flex items-center justify-end flex-shrink-0">
      <div className="flex items-center gap-0.5">
        <button
          onClick={onOpenModal}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="크게 보기"
        >
          <Maximize2 size={12} className="text-muted-foreground" />
        </button>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className={cn(
            "p-1 rounded hover:bg-muted transition-colors",
            isRegenerating && "opacity-50 cursor-not-allowed",
          )}
          title="전체 새로고침"
        >
          <RefreshCw
            size={12}
            className={cn(
              "text-muted-foreground",
              isRegenerating && "animate-spin",
            )}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-2 space-y-4 text-sm">
      {header}

      {/* 오늘 예측 (맨 위) */}
      {isComplete && (
        <div className="space-y-1.5">
          {aiRecommendation ? (
            prescriptionCard
          ) : (
            <div className="border-[1.5px] border-dashed border-amber-400 bg-amber-50/40 rounded-md p-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 mb-1">
                <Sparkles size={12} />
                예상 처방
              </div>
              <div className="text-xs text-muted-foreground">처방 예측 결과가 없습니다</div>
            </div>
          )}
        </div>
      )}

      {/* 예상 상병 */}
      {symptomDiseaseCard}

      {/* 예상 진찰 */}
      {isComplete && aiRecommendation && consultationCard}

      {/* Status messages */}
      {isPending && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          AI 분석 생성 중...
        </div>
      )}
      {isErrorStatus && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle size={12} />
          오류: {errorMessage || "AI 분석 생성 실패"}
          <button onClick={onRegenerate} className="text-primary hover:underline ml-1">
            재시도
          </button>
        </div>
      )}
      {isAggregated && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border rounded-md p-2 bg-amber-50/30">
          <Loader2 size={12} className="animate-spin text-amber-600" />
          AI 예측 생성 중...
        </div>
      )}

      {/* 재내원 예측 */}
      {visitPredictionCard}

      {/* 자동 메모 */}
      {autoMemoCard}

      {/* Timestamp */}
      {(isAggregated || isComplete) && createDateTime && (
        <div className="text-[10px] text-muted-foreground/60 pt-1 border-t">
          생성: {new Date(createDateTime).toLocaleString("ko-KR")}
        </div>
      )}

      {/* 자세히 보기 link */}
      <button
        onClick={onOpenModal}
        className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1"
      >
        자세히 보기 ›
      </button>

      {/* Full-screen modal */}
      {modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[200]">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={onCloseModal}
            />
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="bg-background border rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] p-6 relative pointer-events-auto overflow-y-auto text-sm [&_.text-xs]:text-sm [&_.text-\[10px\]]:text-xs [&_.text-\[9px\]]:text-xs">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <span className="text-lg font-semibold">환자 진료이력 요약</span>
                  <button
                    onClick={onCloseModal}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* a. 예상 처방 */}
                  {isComplete && (
                    <div className="space-y-1.5">
                      {aiRecommendation ? (
                        prescriptionCard
                      ) : (
                        <div className="border-[1.5px] border-dashed border-amber-400 bg-amber-50/40 rounded-md p-2">
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 mb-1">
                            <Sparkles size={12} />
                            예상 처방
                          </div>
                          <div className="text-xs text-muted-foreground">처방 예측 결과가 없습니다</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* b. 예상 상병 */}
                  {symptomDiseaseCard}

                  {/* c. 예상 진찰 */}
                  {isComplete && aiRecommendation && consultationCard}

                  {/* d-g. Modal-only detail cards */}
                  {detailCards}

                  {/* h. 재내원 예측 */}
                  {visitPredictionCard}

                  {/* i. 자동 메모 */}
                  {autoMemoCard}

                  {/* j. Timestamp */}
                  {(isAggregated || isComplete) && createDateTime && (
                    <div className="text-[10px] text-muted-foreground/60 pt-1 border-t">
                      생성: {new Date(createDateTime).toLocaleString("ko-KR")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
