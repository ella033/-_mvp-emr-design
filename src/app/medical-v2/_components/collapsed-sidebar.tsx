"use client";

import React from "react";
import {
  Home,
  ClipboardList,
  Stethoscope,
  FlaskConical,
  CalendarDays,
  Users,
  Receipt,
  FileText,
  Database,
  BarChart3,
  Settings,
  Plus,
  PanelLeftClose,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "홈", active: false, href: "/home" },
  { icon: ClipboardList, label: "접수", active: false },
  { icon: Stethoscope, label: "진료", active: true },
  { icon: FlaskConical, label: "수탁 검사", active: false },
  { icon: CalendarDays, label: "예약", active: false },
  { icon: Users, label: "CRM", active: false },
  { icon: Receipt, label: "청구", active: false },
  { icon: FileText, label: "서식", active: false },
  { icon: Database, label: "기초자료", active: false },
  { icon: BarChart3, label: "통계", active: false },
  { icon: Settings, label: "설정", active: false },
];

export default function CollapsedSidebar() {
  return (
    <div className="flex w-[50px] flex-col items-center bg-[#eef0f8] border-r border-[#c2c4c8] px-[4px] pb-[4px]">
      {/* Toggle button */}
      <div className="flex w-full items-center justify-center py-[12px]">
        <PanelLeftClose className="h-[20px] w-[20px] text-[#46474c]" />
      </div>

      {/* Navigation items */}
      <div className="flex flex-1 flex-col items-center gap-0 w-full">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center justify-center rounded-[6px] p-[12px] transition-colors ${
              item.active
                ? "bg-[#453EDC] text-white"
                : "text-[#46474c] hover:bg-[#dde0eb]"
            }`}
            title={item.label}
            onClick={() => {
              if ((item as any).href) window.location.href = (item as any).href;
            }}
          >
            <item.icon className="h-[20px] w-[20px]" />
          </button>
        ))}
      </div>

      {/* Bottom plus button */}
      <div className="flex w-full items-center justify-center">
        <button
          className="flex w-full items-center justify-center rounded-full bg-[#46474c] p-[12px] text-white"
          title="추가"
        >
          <Plus className="h-[20px] w-[20px]" />
        </button>
      </div>
    </div>
  );
}
