"use client";

import React from "react";
import type { StructuredSummary } from "@/types/chart/ai-prediction-types";

interface SummaryTextProps {
  summary: StructuredSummary;
}

/** HTML 태그 제거 후 텍스트만 추출 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function SummaryText({ summary }: SummaryTextProps) {
  const { diseaseHistory, prescriptionHistory, symptomMemoHistory } =
    summary;

  return (
    <div className="space-y-1.5 text-xs">
      <div className="text-xs font-medium text-muted-foreground">요약 정보</div>

      {/* Disease history */}
      {diseaseHistory.length > 0 && (
        <div className="flex flex-wrap gap-x-1">
          <span className="font-medium text-muted-foreground">[상병]</span>
          {diseaseHistory.slice(0, 5).map((d, idx) => (
            <span key={d.code}>
              <span className={d.isChronic ? "text-red-600 font-medium" : ""}>
                {stripHtml(d.code)} {stripHtml(d.name)}
              </span>
              {d.isChronic && (
                <span className="text-[10px] text-red-500">(만성)</span>
              )}
              <span className="text-muted-foreground"> {d.encounterCount}회</span>
              {idx < Math.min(diseaseHistory.length, 5) - 1 && (
                <span className="text-muted-foreground"> | </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Prescription history */}
      {prescriptionHistory.length > 0 && (
        <div className="flex flex-wrap gap-x-1">
          <span className="font-medium text-muted-foreground">[처방]</span>
          {prescriptionHistory.slice(0, 4).map((p, idx) => (
            <span key={p.claimCode}>
              {stripHtml(p.name)}
              <span className="text-muted-foreground">
                {" "}
                최종{p.lastPrescribed?.slice(2, 7).replace("-", ".")}
              </span>
              {idx < Math.min(prescriptionHistory.length, 4) - 1 && (
                <span className="text-muted-foreground"> | </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Vital sign trends — graph is rendered separately via VitalTrendChart */}

      {/* Symptoms */}
      {symptomMemoHistory.length > 0 && (() => {
        const entries = symptomMemoHistory
          .slice(0, 3)
          .map((s) => ({
            date: s.date?.slice(2, 10).replace(/-/g, "."),
            text: stripHtml(s.symptom || s.memo || ""),
          }))
          .filter((e) => e.text);

        if (entries.length === 0) return null;

        return (
          <div className="flex flex-wrap gap-x-1">
            <span className="font-medium text-muted-foreground">[증상]</span>
            {entries.map((e, idx) => (
              <span key={idx}>
                <span className="text-muted-foreground">{e.date}</span>{" "}
                {e.text}
                {idx < entries.length - 1 && (
                  <span className="text-muted-foreground"> | </span>
                )}
              </span>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
