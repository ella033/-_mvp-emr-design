"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Role = "reception" | "doctor";

interface KpiItem {
  label: string;
  value: number;
  unit: string;
  subLabel: string;
  subValue: string;
  trend: "up" | "down" | "neutral";
  danger?: boolean;
}

const RECEPTION_KPI: KpiItem[] = [
  { label: "오늘 예약", value: 32, unit: "건", subLabel: "전일 대비", subValue: "+5건", trend: "up" },
  { label: "현재 대기", value: 8, unit: "명", subLabel: "평균 대기", subValue: "12분", trend: "neutral" },
  { label: "미수금 현황", value: 2, unit: "건", subLabel: "총 미납", subValue: "150,000원", trend: "up", danger: true },
  { label: "오늘 수납", value: 1840000, unit: "원", subLabel: "완료", subValue: "18건", trend: "up" },
];

const DOCTOR_KPI: KpiItem[] = [
  { label: "오늘 예약", value: 28, unit: "명", subLabel: "재진 22 / 초진 6", subValue: "", trend: "neutral" },
  { label: "현재 대기", value: 5, unit: "명", subLabel: "최장 대기", subValue: "18분", trend: "neutral" },
  { label: "검사 결과 확인", value: 7, unit: "건", subLabel: "혈액 3 / 영상 2 / 기타 2", subValue: "", trend: "up", danger: true },
  { label: "진료 완료", value: 12, unit: "명", subLabel: "완료율", subValue: "43%", trend: "up" },
];

function formatValue(value: number, unit: string) {
  if (unit === "원") return value.toLocaleString();
  return value.toString();
}

export default function KpiCards({ role }: { role: Role }) {
  const kpis = role === "doctor" ? DOCTOR_KPI : RECEPTION_KPI;

  return (
    <div className="grid grid-cols-4 gap-[12px] mb-[20px]">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`rounded-[12px] border px-[18px] py-[16px] transition-shadow hover:shadow-sm ${
            kpi.danger
              ? "bg-[#FFF5F5] border-[#FFC9C9]"
              : "bg-white border-[#E9ECEF]"
          }`}
        >
          <span className="text-[12px] font-medium text-[#868E96]">{kpi.label}</span>
          <div className="flex items-baseline gap-[4px] mt-[6px]">
            <span className={`text-[26px] font-bold tracking-[-0.03em] ${kpi.danger ? "text-[#E03131]" : "text-[#212529]"}`}>
              {formatValue(kpi.value, kpi.unit)}
            </span>
            <span className="text-[13px] font-medium text-[#868E96]">{kpi.unit}</span>
          </div>
          <div className="flex items-center gap-[4px] mt-[6px]">
            {kpi.trend === "up" && <TrendingUp className={`h-[12px] w-[12px] ${kpi.danger ? "text-[#E03131]" : "text-[#2B8A3E]"}`} />}
            {kpi.trend === "down" && <TrendingDown className="h-[12px] w-[12px] text-[#E03131]" />}
            {kpi.trend === "neutral" && <Minus className="h-[12px] w-[12px] text-[#868E96]" />}
            <span className="text-[11px] font-medium text-[#868E96]">
              {kpi.subLabel}{kpi.subValue ? ` ${kpi.subValue}` : ""}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
