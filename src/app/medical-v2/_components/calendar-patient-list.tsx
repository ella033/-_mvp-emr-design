"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Phone,
} from "lucide-react";
import CardMoreMenu from "./layout/card-more-menu";
import CardHeader from "./layout/card-header";
import CardModule from "./layout/card-module";

/* ──────────────────────────────────────────────
 * 캘린더 유틸
 * ────────────────────────────────────────────── */
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const days: { day: number; currentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true });
  }
  const remaining = 35 - days.length;
  if (remaining > 0) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
  }
  return days;
}

/* ──────────────────────────────────────────────
 * 대기 환자 데이터
 * ────────────────────────────────────────────── */
const MOCK_PATIENTS = [
  {
    id: "2400001",
    name: "김유비",
    gender: "여",
    age: 30,
    status: "진료중",
    statusType: "active" as const,
    badges: ["재진", "건보"],
    highlight: "38.4°C",
    memo: "MRI 촬영 원함",
    time: "",
  },
  {
    id: "2400165",
    name: "박찬호",
    gender: "남",
    age: 24,
    status: "",
    statusType: "none" as const,
    badges: ["재진", "건보"],
    highlight: "",
    memo: "지난번 검사결과 문의",
    time: "2분",
  },
  {
    id: "2400166",
    name: "이영희",
    gender: "여",
    age: 25,
    status: "",
    statusType: "none" as const,
    badges: ["초진", "건보"],
    highlight: "",
    memo: "약물 복용 상담 요청",
    time: "6분",
  },
  {
    id: "2400167",
    name: "김철수",
    gender: "남",
    age: 30,
    status: "",
    statusType: "none" as const,
    badges: ["재진", "일반"],
    highlight: "",
    memo: "예방접종 일정 확인",
    time: "7분",
  },
  {
    id: "2400168",
    name: "이수진",
    gender: "여",
    age: 22,
    status: "",
    statusType: "none" as const,
    badges: ["초진", "건보"],
    highlight: "",
    memo: "",
    time: "9분",
  },
  {
    id: "2400169",
    name: "남궁건",
    gender: "남",
    age: 40,
    status: "",
    statusType: "none" as const,
    badges: ["초진", "일반"],
    highlight: "",
    memo: "검사 결과 문의",
    time: "12분",
  },
  {
    id: "2400170",
    name: "한지민",
    gender: "여",
    age: 29,
    status: "",
    statusType: "none" as const,
    badges: ["초진", "건보"],
    highlight: "",
    memo: "건강 검진 결과 확인",
    time: "18분",
  },
  {
    id: "2400171",
    name: "제갈공명",
    gender: "남",
    age: 34,
    status: "",
    statusType: "none" as const,
    badges: ["재진", "건보"],
    highlight: "",
    memo: "알러지 검사 요청",
    time: "20분",
  },
];

/* ──────────────────────────────────────────────
 * 배지 색상 매핑
 * ────────────────────────────────────────────── */
function getBadgeStyle(badge: string) {
  switch (badge) {
    case "초진":
      return "text-[#0066FF]";
    case "일반":
      return "text-[#7C5CFA]";
    default:
      return "text-[#989BA2]";
  }
}

/* ──────────────────────────────────────────────
 * 메인 컴포넌트
 * ────────────────────────────────────────────── */
const STATUS_TABS = [
  { key: "reservation", label: "예약", count: 0 },
  { key: "waiting", label: "대기", count: 8 },
  { key: "hold", label: "보류", count: 0 },
  { key: "payment", label: "수납", count: 2 },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];

// 공휴일 (한국 주요 공휴일 - 양력)
const HOLIDAYS: Record<string, string> = {
  "1-1": "신정", "3-1": "삼일절", "5-5": "어린이날", "6-6": "현충일",
  "8-15": "광복절", "10-3": "개천절", "10-9": "한글날", "12-25": "크리스마스",
};

function isHoliday(year: number, month: number, day: number) {
  return HOLIDAYS[`${month}-${day}`] !== undefined;
}

export default function CalendarPatientList() {
  const today = new Date();
  const [calYear, setCalYear] = useState(2025);
  const [calMonth, setCalMonth] = useState(7);
  const [selectedDate, setSelectedDate] = useState(25);
  const [activeTab, setActiveTab] = useState<StatusTab>("waiting");
  const [calledPatients, setCalledPatients] = useState<Set<string>>(
    new Set(["2400001"])
  );
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const calendarDays = generateCalendarDays(calYear, calMonth);

  const goToToday = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth() + 1);
    setSelectedDate(today.getDate());
  };

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12); }
    else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1); }
    else setCalMonth((m) => m + 1);
  };

  const handleCall = (patientId: string) => {
    setCalledPatients((prev) => new Set([...prev, patientId]));
  };

  return (
    <div className="flex w-full h-full flex-col gap-[6px] overflow-hidden">
      {/* ─── 캘린더 카드 ─── */}
      <CardModule widgetId="calendar" className="rounded-[6px] border border-[#C2C4C8] bg-white">
        {/* 캘린더 헤더 */}
        <CardHeader widgetId="calendar" className="justify-between">
          <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
            캘린더
          </span>
          <CardMoreMenu widgetId="calendar-patients" />
        </CardHeader>

        {/* 년월 네비게이션 */}
        <div className="flex items-center gap-[4px] px-[12px] pt-[10px] pb-[6px]">
          <span className="text-[14px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
            {calYear}년 {calMonth}월
          </span>
          <button className="p-[2px] text-[#989BA2] hover:text-[#171719]" onClick={prevMonth}>
            <ChevronLeft className="h-[16px] w-[16px]" />
          </button>
          <button className="p-[2px] text-[#989BA2] hover:text-[#171719]" onClick={nextMonth}>
            <ChevronRight className="h-[16px] w-[16px]" />
          </button>
          <button className="ml-auto text-[12px] text-[#989BA2] hover:text-[#453EDC]" onClick={goToToday}>
            오늘
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 px-[8px]">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`flex items-center justify-center py-[4px] text-[11px] font-bold ${
                idx === 0
                  ? "text-[#FF4242]"
                  : idx === 6
                    ? "text-[#453EDC]"
                    : "text-[#989BA2]"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 px-[8px] pb-[10px]">
          {calendarDays.map((d, idx) => {
            const isSelected = d.currentMonth && d.day === selectedDate;
            const isSunday = idx % 7 === 0;
            const isSaturday = idx % 7 === 6;
            const holiday = d.currentMonth && isHoliday(calYear, calMonth, d.day);
            const isRed = isSunday || holiday;

            return (
              <button
                key={idx}
                className={`flex h-[28px] items-center justify-center rounded-full text-[12px] transition-colors ${
                  !d.currentMonth
                    ? "text-[#C2C4C8]"
                    : isSelected
                      ? "bg-[#453EDC] text-white font-bold"
                      : isRed
                        ? "text-[#FF4242] hover:bg-[#F4F4F5]"
                        : isSaturday
                          ? "text-[#453EDC] hover:bg-[#F4F4F5]"
                          : "text-[#171719] hover:bg-[#F4F4F5]"
                }`}
                onClick={() => d.currentMonth && setSelectedDate(d.day)}
              >
                {d.day}
              </button>
            );
          })}
        </div>
      </CardModule>

      {/* ─── 대기 현황 카드 ─── */}
      <CardModule widgetId="waiting-list" className="flex-1 rounded-[6px] border border-[#C2C4C8] bg-white min-h-0">
        {/* 대기 현황 헤더 */}
        <CardHeader widgetId="waiting-list" className="justify-between">
          <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
            대기 현황
          </span>
          <CardMoreMenu widgetId="calendar-patients" />
        </CardHeader>

        {/* 상태 탭 */}
        <div className="flex items-center border-b border-[#EAEBEC] shrink-0">
          {STATUS_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            return (
              <React.Fragment key={tab.key}>
                {idx > 0 && (
                  <div className="h-[12px] w-px bg-[#EAEBEC]" />
                )}
                <button
                  className={`flex flex-1 items-center justify-center gap-[4px] py-[8px] text-[12px] transition-colors ${
                    isActive
                      ? "font-bold text-[#453EDC]"
                      : "text-[#989BA2] hover:text-[#70737C]"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`${
                      isActive
                        ? "font-bold text-[#453EDC]"
                        : tab.count > 0
                          ? "font-bold text-[#171719]"
                          : "text-[#C2C4C8]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* 환자 리스트 */}
        <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
          {MOCK_PATIENTS.map((patient) => {
            const isCalled = calledPatients.has(patient.id);
            const isHovered = hoveredTime === patient.id;
            const hasTime = !!patient.time && !isCalled;

            return (
              <div
                key={patient.id}
                className={`flex flex-col gap-[4px] border-b border-[#EAEBEC] px-[12px] py-[8px] cursor-pointer transition-colors ${
                  isCalled
                    ? "bg-[#F1EDFF]"
                    : "bg-white hover:bg-[#F8F8FA]"
                }`}
                onMouseEnter={() => hasTime ? setHoveredTime(patient.id) : undefined}
                onMouseLeave={() => setHoveredTime(null)}
              >
                {/* 첫 줄 */}
                <div className="flex items-center gap-[4px]">
                  {isCalled && (
                    <div className="flex h-[16px] w-[16px] items-center justify-center rounded-[3px] bg-[#FF4242] shrink-0">
                      <span className="text-[9px] font-bold text-white leading-none">N</span>
                    </div>
                  )}
                  <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
                    {patient.id}
                  </span>
                  <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
                    {patient.name}
                  </span>
                  <span className="text-[12px] text-[#989BA2]">
                    ({patient.gender}/{patient.age})
                  </span>

                  {/* 우측: 진료중 / 호출 버튼 / 대기시간 */}
                  <span className="ml-auto shrink-0">
                    {isCalled ? (
                      <span className="text-[12px] font-bold text-[#453EDC]">
                        진료중
                      </span>
                    ) : isHovered ? (
                      <button
                        className="flex items-center justify-center rounded-[14px] bg-[#453EDC] px-[10px] py-[3px] text-[11px] font-bold text-white transition-all hover:bg-[#3730B0]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(patient.id);
                        }}
                      >
                        호출
                      </button>
                    ) : patient.time ? (
                      <span className="text-[12px] text-[#989BA2]">
                        {patient.time}
                      </span>
                    ) : null}
                  </span>
                </div>

                {/* 둘째 줄 */}
                <div className="flex items-center gap-[4px] text-[11px] text-[#989BA2] truncate">
                  {patient.badges.map((badge) => (
                    <span key={badge} className={getBadgeStyle(badge)}>
                      {badge}
                    </span>
                  ))}
                  {patient.highlight && (
                    <span className="text-[11px] font-bold text-[#FF4242]">
                      {patient.highlight}
                    </span>
                  )}
                  {patient.memo && (
                    <>
                      <span className="text-[#C2C4C8]">|</span>
                      <span className="truncate">{patient.memo}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardModule>
    </div>
  );
}

