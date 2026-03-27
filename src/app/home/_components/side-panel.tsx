"use client";

import React from "react";
import { ArrowRight, Stethoscope, Receipt, CalendarDays, FlaskConical, FileText } from "lucide-react";

type Role = "reception" | "doctor";

/* ── Quick Actions ── */
function QuickActions({ role }: { role: Role }) {
  const actions = role === "doctor"
    ? [
        { label: "진료실 바로가기", icon: Stethoscope, primary: true },
        { label: "처방 템플릿", icon: FileText },
        { label: "검사 결과", icon: FlaskConical },
      ]
    : [
        { label: "접수 화면 바로가기", icon: Receipt, primary: true },
        { label: "수납 현황", icon: Receipt },
        { label: "예약 관리", icon: CalendarDays },
      ];

  return (
    <div className="flex flex-col gap-[6px] mb-[16px]">
      {actions.map((a) => (
        <button
          key={a.label}
          className={`flex items-center gap-[10px] rounded-[8px] px-[14px] py-[10px] text-[12px] font-semibold transition-colors ${
            a.primary
              ? "bg-[#6541F2] text-white hover:bg-[#5535D4]"
              : "bg-[#F8F9FA] text-[#495057] border border-[#E9ECEF] hover:bg-[#F1F3F5]"
          }`}
        >
          <a.icon className="h-[16px] w-[16px]" />
          <span className="flex-1 text-left">{a.label}</span>
          <ArrowRight className="h-[14px] w-[14px] opacity-60" />
        </button>
      ))}
    </div>
  );
}

/* ── Recent Payments (Reception) ── */
function RecentPayments() {
  const items = [
    { name: "김유비", amount: "83,000원", status: "완료", time: "08:52" },
    { name: "이철수", amount: "45,000원", status: "완료", time: "08:48" },
    { name: "박영희", amount: "120,000원", status: "완료", time: "08:40" },
  ];

  return (
    <div className="rounded-[10px] bg-white border border-[#E9ECEF] p-[16px_18px] mb-[12px]">
      <h3 className="text-[13px] font-bold text-[#212529] mb-[10px]">최근 수납</h3>
      {items.map((item, idx) => (
        <div key={idx} className={`flex items-center justify-between py-[9px] ${idx > 0 ? "border-t border-[#F1F3F5]" : ""}`}>
          <div className="flex items-center gap-[8px]">
            <span className="text-[12px] font-semibold text-[#495057]">{item.name}</span>
            <span className="text-[12px] text-[#868E96]">{item.amount}</span>
          </div>
          <div className="flex items-center gap-[6px]">
            <span className="rounded-[4px] bg-[#EBFBEE] px-[8px] py-[2px] text-[10px] font-bold text-[#2B8A3E]">{item.status}</span>
            <span className="text-[11px] text-[#ADB5BD]">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Test Results (Doctor) ── */
function TestResults() {
  const items = [
    { name: "김유비", type: "혈액", item: "HbA1c", value: "8.1%", status: "이상", statusColor: "red", time: "08:30" },
    { name: "박찬호", type: "영상", item: "MRI", value: "판독 대기", status: "대기", statusColor: "blue", time: "08:45" },
    { name: "이수진", type: "혈액", item: "공복혈당", value: "130 mg/dL", status: "주의", statusColor: "amber", time: "08:20" },
    { name: "남궁건", type: "혈액", item: "LDL-C", value: "95 mg/dL", status: "정상", statusColor: "green", time: "08:10" },
    { name: "김철수", type: "기타", item: "인플루엔자 항체", value: "양성", status: "정상", statusColor: "green", time: "07:50" },
  ];

  const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    red: { bg: "bg-[#FFF5F5]", text: "text-[#E03131]" },
    blue: { bg: "bg-[#E7F5FF]", text: "text-[#1971C2]" },
    amber: { bg: "bg-[#FFF9DB]", text: "text-[#E67700]" },
    green: { bg: "bg-[#EBFBEE]", text: "text-[#2B8A3E]" },
  };

  return (
    <div className="rounded-[10px] bg-white border border-[#E9ECEF] p-[16px_18px] mb-[12px]">
      <h3 className="text-[13px] font-bold text-[#212529] mb-[10px]">검사 결과 확인</h3>
      {items.map((item, idx) => {
        const s = STATUS_STYLES[item.statusColor];
        return (
          <div key={idx} className={`flex items-center justify-between py-[9px] ${idx > 0 ? "border-t border-[#F1F3F5]" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[6px]">
                <span className="text-[12px] font-semibold text-[#495057]">{item.name}</span>
                <span className="text-[11px] text-[#ADB5BD]">{item.type}</span>
              </div>
              <p className="text-[12px] text-[#868E96] mt-[1px]">
                {item.item}: <span className={`font-bold ${s.text}`}>{item.value}</span>
              </p>
            </div>
            <div className="flex items-center gap-[6px] shrink-0">
              <span className={`rounded-[4px] px-[8px] py-[2px] text-[10px] font-bold ${s.bg} ${s.text}`}>{item.status}</span>
              <span className="text-[11px] text-[#ADB5BD] min-w-[36px] text-right">{item.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Waiting Status Mini Cards ── */
function WaitingStatus({ role }: { role: Role }) {
  const items = role === "doctor"
    ? [{ label: "재진", value: 22 }, { label: "초진", value: 6 }, { label: "검사 대기", value: 3 }]
    : [{ label: "접수 대기", value: 3 }, { label: "진료 대기", value: 5 }, { label: "수납 대기", value: 2 }];

  return (
    <div className="grid grid-cols-3 gap-[8px] mb-[12px]">
      {items.map((item) => (
        <div key={item.label} className="rounded-[8px] bg-[#F8F9FA] border border-[#E9ECEF] px-[12px] py-[10px] text-center">
          <span className="text-[18px] font-bold text-[#212529]">{item.value}</span>
          <p className="text-[10px] text-[#868E96] mt-[2px]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── AI Next Step ── */
function AiNextStep({ role }: { role: Role }) {
  const text = role === "doctor"
    ? "첫 환자 김유비의 HbA1c가 3회 연속 상승 중입니다. 약물 조정 방향을 사전에 검토하시는 것을 권장합니다."
    : "09:00 박찬호 환자의 미수금 85,000원이 있습니다. 접수 시 수납 안내를 먼저 진행해주세요.";

  return (
    <div className="rounded-[10px] bg-[#EEEDFE] border border-[rgba(180,165,247,0.4)] p-[14px_16px]">
      <div className="flex items-center gap-[6px] mb-[6px]">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-[#6541F2]">
          <span className="text-[9px] font-bold text-white">AI</span>
        </div>
        <span className="text-[12px] font-semibold text-[#6541F2]">의사랑 AI 제안</span>
      </div>
      <p className="text-[12px] text-[#3C2A9E] leading-[1.6]">{text}</p>
      <button className="mt-[10px] rounded-[6px] bg-[#6541F2] px-[14px] py-[6px] text-[11px] font-semibold text-white hover:bg-[#5535D4]">
        {role === "doctor" ? "AI 요약 보기" : "접수 화면으로"}
      </button>
    </div>
  );
}

/* ── Main Side Panel ── */
export default function SidePanel({ role }: { role: Role }) {
  return (
    <div className="flex flex-col gap-0">
      <QuickActions role={role} />
      {role === "doctor" ? <TestResults /> : <RecentPayments />}
      <WaitingStatus role={role} />
      <AiNextStep role={role} />
    </div>
  );
}
