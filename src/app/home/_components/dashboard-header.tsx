"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";

type Role = "reception" | "doctor";

export default function DashboardHeader({ role, onRoleChange }: { role: Role; onRoleChange: (r: Role) => void }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const dateStr = time.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
  const timeStr = time.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center h-[56px] px-[32px] bg-white border-b border-[#E9ECEF] shrink-0">
      {/* Left — Greeting */}
      <div className="flex items-center gap-[12px]">
        <h1 className="text-[18px] font-bold text-[#212529] tracking-[-0.03em]">
          {greeting}, Dr. 홍
        </h1>
        <span className="text-[12px] text-[#868E96]">{dateStr} {timeStr}</span>
      </div>

      {/* Center — Role Tabs */}
      <div className="flex items-center gap-[4px] ml-[32px] bg-[#F1F3F5] rounded-[8px] p-[3px]">
        <button
          className={`px-[14px] py-[5px] rounded-[6px] text-[12px] font-semibold transition-all ${
            role === "doctor"
              ? "bg-white text-[#212529] shadow-sm"
              : "text-[#868E96] hover:text-[#495057]"
          }`}
          onClick={() => onRoleChange("doctor")}
        >
          <span className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#0C8599]" />
            진료의
          </span>
        </button>
        <button
          className={`px-[14px] py-[5px] rounded-[6px] text-[12px] font-semibold transition-all ${
            role === "reception"
              ? "bg-white text-[#212529] shadow-sm"
              : "text-[#868E96] hover:text-[#495057]"
          }`}
          onClick={() => onRoleChange("reception")}
        >
          <span className="flex items-center gap-[6px]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#6541F2]" />
            원무과
          </span>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-[8px] ml-auto">
        <button className="p-[6px] text-[#868E96] hover:text-[#495057] rounded-[6px] hover:bg-[#F1F3F5]">
          <Search className="h-[16px] w-[16px]" />
        </button>
        <button className="relative p-[6px] text-[#868E96] hover:text-[#495057] rounded-[6px] hover:bg-[#F1F3F5]">
          <Bell className="h-[16px] w-[16px]" />
          <span className="absolute top-[4px] right-[4px] h-[6px] w-[6px] rounded-full bg-[#E03131]" />
        </button>
        <div className="ml-[4px] flex items-center gap-[8px]">
          <div className="h-[30px] w-[30px] rounded-full bg-gradient-to-br from-[#F4A130] to-[#E8751A] flex items-center justify-center">
            <span className="text-[12px] font-bold text-white">홍</span>
          </div>
          <span className="text-[13px] font-semibold text-[#212529]">홍길동</span>
        </div>
      </div>
    </div>
  );
}
