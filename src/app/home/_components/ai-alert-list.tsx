"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

type Role = "reception" | "doctor";
type AlertLevel = "critical" | "warning" | "info";

interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  patient: string;
  description: string;
  detail?: string;
  action: string;
  metrics?: { label: string; value: string; trend: "up" | "down" | "stable"; abnormal: boolean }[];
}

const LEVEL_STYLES: Record<AlertLevel, { bg: string; border: string; badge: string; badgeText: string }> = {
  critical: { bg: "bg-[#FFF5F5]", border: "border-[#FFC9C9]", badge: "bg-[#E03131]", badgeText: "긴급" },
  warning: { bg: "bg-[#FFF9DB]", border: "border-[#FFE066]", badge: "bg-[#E67700]", badgeText: "주의" },
  info: { bg: "bg-[#E7F5FF]", border: "border-[#A5D8FF]", badge: "bg-[#1971C2]", badgeText: "참고" },
};

const RECEPTION_ALERTS: Alert[] = [
  { id: "r1", level: "critical", title: "미수금 환자 접수 예정", patient: "박찬호 (남/45)", description: "미수금 85,000원 (2건). 접수 시 수납 안내 필요", action: "접수 시 안내" },
  { id: "r2", level: "warning", title: "보험 자격 변경 감지", patient: "이영희 (여/25)", description: "건강보험 → 의료급여 2종 변경 확인됨. 본인부담률 변경 적용 필요", action: "자격 확인" },
  { id: "r3", level: "warning", title: "예약 메모 — 특이사항", patient: "김유비 (여/30)", description: "지난번 검진 결과 문의 예정. 검사 결과지 출력 준비 필요", action: "메모 확인" },
  { id: "r4", level: "info", title: "환불 이력 알림", patient: "한지민 (여/29)", description: "최근 3개월 내 2회 환불 이력. 수납 시 확인 권장", action: "이력 확인" },
];

const DOCTOR_ALERTS: Alert[] = [
  { id: "d1", level: "critical", title: "약물 상호작용 경고", patient: "김유비 (여/30)", description: "아스피린 + 와파린 병용금기. NSAIDs 주의 (eGFR 62)",
    detail: "현재 처방 중인 아스피린(100mg)과 와파린 병용은 출혈 위험 3.2배 증가. eGFR 62로 NSAIDs 투여 시 급성 신손상 위험.",
    action: "처방 확인",
    metrics: [
      { label: "HbA1c", value: "8.1%", trend: "up", abnormal: true },
      { label: "eGFR", value: "62", trend: "down", abnormal: true },
      { label: "수축기혈압", value: "138", trend: "stable", abnormal: false },
    ],
  },
  { id: "d2", level: "critical", title: "검사 이상치 — 즉시 확인", patient: "박찬호 (남/45)", description: "체온 38.4°C, MRI 판독 결과 대기 중",
    detail: "금일 측정 체온 38.4°C로 발열 상태. MRI 촬영 요청 건 판독 결과 도착 예정.",
    action: "검사 확인",
    metrics: [
      { label: "체온", value: "38.4°C", trend: "up", abnormal: true },
    ],
  },
  { id: "d3", level: "warning", title: "처방 삭감 위험", patient: "남궁건 (남/40)", description: "특정내역 미기재 이력 2건. 검사 결과 코멘트 필요", action: "내역 확인" },
  { id: "d4", level: "info", title: "동일 처방 반복 알림", patient: "이수진 (여/22)", description: "감기 묶음처방 최근 3회 연속 동일. 추가 검사 고려", action: "이력 보기" },
  { id: "d5", level: "info", title: "예방접종 일정 도래", patient: "김철수 (남/30)", description: "인플루엔자 예방접종 일정 (10월). 환자 안내 필요", action: "일정 확인" },
];

const FILTERS = ["전체", "긴급", "주의", "참고"] as const;
const FILTER_MAP: Record<string, AlertLevel | null> = { "전체": null, "긴급": "critical", "주의": "warning", "참고": "info" };

export default function AiAlertList({ role }: { role: Role }) {
  const [filter, setFilter] = useState<string>("전체");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const alerts = role === "doctor" ? DOCTOR_ALERTS : RECEPTION_ALERTS;
  const filtered = FILTER_MAP[filter]
    ? alerts.filter((a) => a.level === FILTER_MAP[filter])
    : alerts;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-[12px] bg-white border border-[#E9ECEF] p-[18px_20px]">
      <div className="flex items-center justify-between mb-[14px]">
        <h2 className="text-[15px] font-bold text-[#212529] tracking-[-0.02em]">AI 임상 알림</h2>
        <div className="flex gap-[4px]">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`px-[10px] py-[4px] rounded-[12px] text-[11px] font-semibold transition-colors ${
                filter === f ? "bg-[#212529] text-white" : "bg-white text-[#868E96] border border-[#E9ECEF]"
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {filtered.map((alert) => {
          const s = LEVEL_STYLES[alert.level];
          const isExpanded = expandedIds.has(alert.id);
          const isDismissed = dismissedIds.has(alert.id);
          const isDoctor = role === "doctor";

          return (
            <div
              key={alert.id}
              className={`rounded-[10px] border p-[14px_18px] transition-all ${s.bg} ${s.border} ${isDismissed ? "opacity-60" : ""} ${isDoctor ? "cursor-pointer" : ""}`}
              onClick={() => isDoctor && toggleExpand(alert.id)}
            >
              <div className="flex items-start gap-[10px]">
                <span className={`shrink-0 rounded-[4px] px-[7px] py-[2px] text-[10px] font-bold text-white ${s.badge}`}>
                  {s.badgeText}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#212529]">{alert.title}</span>
                    {isDoctor && (
                      isExpanded ? <ChevronUp className="h-[14px] w-[14px] text-[#868E96]" /> : <ChevronDown className="h-[14px] w-[14px] text-[#868E96]" />
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-[#495057] mt-[2px]">{alert.patient}</p>
                  <p className="text-[12px] text-[#868E96] leading-[1.6] mt-[2px]">{alert.description}</p>

                  {/* Metric Pills (Doctor) */}
                  {alert.metrics && (
                    <div className="flex flex-wrap gap-[6px] mt-[8px]">
                      {alert.metrics.map((m) => (
                        <span
                          key={m.label}
                          className={`inline-flex items-center gap-[4px] rounded-[12px] px-[10px] py-[3px] text-[11px] border ${
                            m.abnormal
                              ? "bg-[#FFF5F5] border-[#FFC9C9] text-[#E03131]"
                              : "bg-[#F8F9FA] border-[#E9ECEF] text-[#495057]"
                          }`}
                        >
                          {m.label} <strong>{m.value}</strong>
                          {m.trend === "up" && <span>↑</span>}
                          {m.trend === "down" && <span>↓</span>}
                          {m.trend === "stable" && <span>→</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Detail (Doctor) */}
                  {isDoctor && isExpanded && alert.detail && (
                    <div className={`mt-[10px] pt-[10px] border-t border-dashed ${s.border}`}>
                      <p className="text-[12px] text-[#495057] leading-[1.6]">→ {alert.detail}</p>
                    </div>
                  )}

                  {/* Action Button */}
                  {(!isDoctor || isExpanded) && !isDismissed && (
                    <div className="mt-[10px]">
                      <button
                        className="rounded-[6px] bg-white border border-[#E9ECEF] px-[14px] py-[6px] text-[12px] font-semibold text-[#495057] hover:bg-[#F8F9FA] transition-colors"
                        onClick={(e) => { e.stopPropagation(); setDismissedIds((prev) => new Set(prev).add(alert.id)); }}
                      >
                        {alert.action}
                      </button>
                    </div>
                  )}
                  {isDismissed && (
                    <div className="flex items-center gap-[4px] mt-[8px]">
                      <Check className="h-[12px] w-[12px] text-[#2B8A3E]" />
                      <span className="text-[11px] text-[#2B8A3E] font-medium">확인 완료</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
