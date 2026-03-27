"use client";

import React from "react";

type Role = "reception" | "doctor";

interface ScheduleItem {
  time: string;
  name: string;
  age: number;
  gender: string;
  type: "초진" | "재진";
  reason: string;
  memo?: string;
  tags?: { label: string; color: string }[];
  aiReady?: boolean;
  aiSummary?: string;
  status: "waiting" | "in-progress" | "done";
}

const SCHEDULE: ScheduleItem[] = [
  { time: "09:00", name: "김유비", age: 30, gender: "여", type: "재진", reason: "고혈압/당뇨 정기 진료", memo: "검진 결과 문의", tags: [{ label: "미납", color: "red" }], aiReady: true, aiSummary: "HbA1c 3회 연속 상승(8.1%). 아스피린+와파린 병용금기 확인 필요. eGFR 62로 NSAIDs 주의.", status: "in-progress" },
  { time: "09:00", name: "박찬호", age: 45, gender: "남", type: "재진", reason: "MRI 촬영 원함", tags: [{ label: "메모", color: "amber" }], aiReady: true, aiSummary: "체온 38.4°C 발열. MRI 판독 결과 대기 중. 감염 가능성 검토 필요.", status: "waiting" },
  { time: "09:10", name: "이영희", age: 25, gender: "여", type: "초진", reason: "약물 복용 상담 요청", tags: [{ label: "초진", color: "purple" }, { label: "보험변경", color: "amber" }], status: "waiting" },
  { time: "09:20", name: "김철수", age: 30, gender: "남", type: "재진", reason: "예방접종 일정 확인", aiReady: true, aiSummary: "인플루엔자 예방접종 시기 도래. 지난 접종일로부터 11개월 경과.", status: "waiting" },
  { time: "09:30", name: "이수진", age: 22, gender: "여", type: "초진", reason: "감기 증상", aiReady: true, aiSummary: "동일 감기 묶음처방 3회 연속. 추가 검사 또는 처방 변경 고려.", status: "waiting" },
  { time: "09:40", name: "남궁건", age: 40, gender: "남", type: "재진", reason: "검사 결과 문의", tags: [{ label: "반복", color: "teal" }], aiReady: true, aiSummary: "특정내역 미기재 이력 2건. 삭감 방지를 위한 코멘트 기재 필요.", status: "waiting" },
  { time: "09:50", name: "한지민", age: 29, gender: "여", type: "재진", reason: "건강 검진 결과 확인", status: "waiting" },
  { time: "10:00", name: "제갈공명", age: 34, gender: "남", type: "재진", reason: "알러지 검사 요청", status: "waiting" },
];

const TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-[#FFF5F5]", text: "text-[#E03131]", border: "border-[#FFC9C9]" },
  amber: { bg: "bg-[#FFF9DB]", text: "text-[#E67700]", border: "border-[#FFE066]" },
  purple: { bg: "bg-[#EEEDFE]", text: "text-[#6541F2]", border: "border-[#B4A5F7]" },
  teal: { bg: "bg-[#E6FCF5]", text: "text-[#0C8599]", border: "border-[#96F2D7]" },
};

const STATUS_DOT: Record<string, string> = {
  "in-progress": "bg-[#2B8A3E]",
  waiting: "bg-[#ADB5BD]",
  done: "bg-[#868E96]",
};

export default function ScheduleTimeline({ role }: { role: Role }) {
  return (
    <div className="rounded-[12px] bg-white border border-[#E9ECEF] p-[18px_20px]">
      <h2 className="text-[15px] font-bold text-[#212529] tracking-[-0.02em] mb-[14px]">
        {role === "doctor" ? "오늘의 진료 스케줄" : "오늘의 예약 타임라인"}
      </h2>

      <div className="flex flex-col">
        {SCHEDULE.map((item, idx) => (
          <div key={idx} className={`flex items-start gap-[12px] py-[10px] ${idx > 0 ? "border-t border-[#F1F3F5]" : ""}`}>
            {/* Time */}
            <span className="text-[12px] font-semibold text-[#868E96] min-w-[44px] text-center pt-[2px]">{item.time}</span>

            {/* Dot */}
            <div className="flex flex-col items-center pt-[6px]">
              <div className={`h-[8px] w-[8px] rounded-full ${item.tags?.[0] ? "" : STATUS_DOT[item.status]}`}
                style={item.tags?.[0] ? { backgroundColor: item.tags[0].color === "red" ? "#E03131" : item.tags[0].color === "amber" ? "#E67700" : item.tags[0].color === "purple" ? "#6541F2" : "#0C8599" } : {}}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[6px] flex-wrap">
                {/* Tags */}
                {item.tags?.map((tag) => {
                  const s = TAG_STYLES[tag.color];
                  return (
                    <span key={tag.label} className={`rounded-[4px] border px-[8px] py-[2px] text-[11px] font-semibold ${s.bg} ${s.text} ${s.border}`}>
                      {tag.label}
                    </span>
                  );
                })}
                {/* Name */}
                <span className="text-[13px] font-semibold text-[#212529]">{item.name}</span>
                <span className="text-[12px] text-[#ADB5BD]">{item.gender}/{item.age}</span>
                {/* 초/재진 */}
                <span className={`rounded-[4px] px-[6px] py-[1px] text-[11px] font-semibold ${
                  item.type === "초진"
                    ? "bg-[#EEEDFE] text-[#6541F2]"
                    : "bg-[#F1F3F5] text-[#868E96]"
                }`}>
                  {item.type}
                </span>
                {/* AI Ready Badge (Doctor) */}
                {role === "doctor" && item.aiReady && (
                  <span className="rounded-[4px] bg-[#6541F2] px-[6px] py-[2px] text-[10px] font-bold text-white">AI</span>
                )}
              </div>

              {/* Reason + Memo */}
              <p className="text-[12px] text-[#868E96] mt-[2px]">
                {item.reason}
                {item.memo && <span className="text-[#E67700] font-medium ml-[6px]">📌 {item.memo}</span>}
              </p>

              {/* AI Summary (Doctor only) */}
              {role === "doctor" && item.aiReady && item.aiSummary && (
                <div className="mt-[6px] rounded-[6px] bg-[#EEEDFE] border border-[rgba(180,165,247,0.3)] px-[10px] py-[6px]">
                  <p className="text-[11px] text-[#3C2A9E] leading-[1.5]">
                    <span className="font-semibold">AI:</span> {item.aiSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button className="shrink-0 rounded-[6px] bg-[#F8F9FA] border border-[#E9ECEF] px-[12px] py-[5px] text-[11px] font-semibold text-[#495057] hover:bg-[#F1F3F5] mt-[2px]">
              {role === "doctor" ? "진료" : "접수"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
