"use client";

import React, { useState } from "react";
import DashboardHeader from "./_components/dashboard-header";
import KpiCards from "./_components/kpi-cards";
import AiAlertList from "./_components/ai-alert-list";
import ScheduleTimeline from "./_components/schedule-timeline";
import SidePanel from "./_components/side-panel";
import ProgressBar from "./_components/progress-bar";

type Role = "reception" | "doctor";

export default function HomePage() {
  const [role, setRole] = useState<Role>("doctor");

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <DashboardHeader role={role} onRoleChange={setRole} />

        {/* Content Area */}
        <div className="flex-1 px-[32px] py-[24px] max-w-[1280px] mx-auto w-full">
          {/* AI Greeting */}
          <AiGreeting role={role} />

          {/* KPI Cards */}
          <KpiCards role={role} />

          {/* Progress Bar (Doctor only) */}
          {role === "doctor" && <ProgressBar completed={12} total={28} />}

          {/* 2-Column Layout */}
          <div className="flex gap-[24px] mt-[24px]">
            {/* Left - Main Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-[24px]">
              <AiAlertList role={role} />
              <ScheduleTimeline role={role} />
            </div>

            {/* Right - Side Panel */}
            <div className={`shrink-0 ${role === "doctor" ? "w-[360px]" : "w-[340px]"}`}>
              <SidePanel role={role} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* AI Greeting */
function AiGreeting({ role }: { role: Role }) {
  const message = role === "doctor"
    ? "오늘 예약 28명 중 약물 주의 3건, 검사 이상 2건, 검사 결과 도착 5건이 있습니다. 김유비 환자의 HbA1c 추이를 확인해주세요."
    : "오늘 예약 32명 중 미수금 2건(총 150,000원), 보험 자격변경 1건이 있습니다. 09:00 박찬호 환자 접수 시 미수금 안내가 필요합니다.";

  return (
    <div className="mb-[20px] rounded-[12px] bg-[#EEEDFE] border border-[rgba(180,165,247,0.3)] px-[20px] py-[14px] flex items-start gap-[10px]">
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#6541F2] shrink-0 mt-[1px]">
        <span className="text-[10px] font-bold text-white">AI</span>
      </div>
      <div>
        <span className="text-[12px] font-semibold text-[#6541F2]">의사랑 AI 브리핑</span>
        <p className="text-[12px] text-[#3C2A9E] leading-[1.6] mt-[2px]">{message}</p>
      </div>
    </div>
  );
}
