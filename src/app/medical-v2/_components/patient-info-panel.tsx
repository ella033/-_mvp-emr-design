"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Mic,
  MonitorSpeaker,
  ImageIcon,
  FileCheck,
  Syringe,
  CalendarDays,
  Bot,
  MoreVertical,
  Plus,
  ClipboardList,
  Sparkles,
  X,
} from "lucide-react";
import ConsultationTimeline from "./consultation-timeline";
import CardMoreMenu from "./layout/card-more-menu";
import CardHeader from "./layout/card-header";
import CardModule from "./layout/card-module";

/* ──────────────────────────────────────────────
 * 핵심 수치 데이터
 * ────────────────────────────────────────────── */
const KEY_METRICS = [
  { label: "HbA1c (%)", value: "8.1%", valueColor: "text-[#FF4242]", alert: "▲ 0.3% (전 분기)", alertColor: "text-[#989BA2]",
    bars: [{ c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#FF4242]" }] },
  { label: "수축기혈압 (mmHg)", value: "138", valueColor: "text-[#FF4242]", alert: "안정 유지", alertColor: "text-[#989BA2]",
    bars: [{ c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#453EDC]" }] },
  { label: "공복혈당 (mg/dL)", value: "148", valueColor: "text-[#FF4242]", alert: "▲ 12 (전 방문)", alertColor: "text-[#989BA2]",
    bars: [{ c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#F4B4B4]" }, { c: "bg-[#FF4242]" }] },
  { label: "eGFR (mL/min)", value: "62", valueColor: "text-[#453EDC]", alert: "▼ 6 (전 방문)", alertColor: "text-[#989BA2]",
    bars: [{ c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#B4C8F4]" }, { c: "bg-[#453EDC]" }] },
];

/* ──────────────────────────────────────────────
 * 바이탈 컬럼 / 혈당 옵션
 * ────────────────────────────────────────────── */
const VITAL_COLUMNS = [
  { key: "bp1", label: "혈압1" },
  { key: "bp2", label: "혈압2" },
  { key: "temp", label: "체온" },
  { key: "pulse", label: "맥박" },
  { key: "sugar", label: "혈당" },
  { key: "weight", label: "체중" },
  { key: "height", label: "신장" },
  { key: "bmi", label: "BMI" },
];

const SUGAR_TYPE_OPTIONS = ["FBS", "PP1", "PP2", "PP3", "PP4", "PP5", "PP6", "임의"];

/* 바이탈 히스토리 (팝업용) */
const VITAL_HISTORY = [
  { date: "2025-09-18 09:00", bp1: "", bp2: "", temp: "36.2", pulse: "59", sugar: "PP1", sugarVal: "116", weight: "", height: "", bmi: "" },
  { date: "2025-09-09 09:00", bp1: "163", bp2: "48", temp: "36.2", pulse: "59", sugar: "PP1", sugarVal: "116", weight: "132", height: "", bmi: "148" },
  { date: "2025-09-09 09:00", bp1: "165", bp2: "50", temp: "37.0", pulse: "60", sugar: "PP1", sugarVal: "119", weight: "48", height: "", bmi: "142" },
  { date: "2025-09-09 09:00", bp1: "167", bp2: "52", temp: "38.1", pulse: "62", sugar: "PP1", sugarVal: "120", weight: "72", height: "178", bmi: "145" },
  { date: "2025-09-09 09:00", bp1: "170", bp2: "53", temp: "39.5", pulse: "64", sugar: "PP1", sugarVal: "122", weight: "148", height: "", bmi: "148" },
  { date: "2025-09-09 09:00", bp1: "172", bp2: "55", temp: "40.2", pulse: "66", sugar: "PP1", sugarVal: "124", weight: "150", height: "", bmi: "150" },
  { date: "2025-09-09 09:00", bp1: "175", bp2: "57", temp: "41.0", pulse: "68", sugar: "PP1", sugarVal: "126", weight: "153", height: "", bmi: "153" },
  { date: "2025-09-09 09:00", bp1: "176", bp2: "58", temp: "43.5", pulse: "70", sugar: "PP1", sugarVal: "130", weight: "155", height: "", bmi: "155" },
];

/* ──────────────────────────────────────────────
 * 접었다 펼치기 섹션
 * ────────────────────────────────────────────── */
function CollapsibleSection({ title, expanded, onToggle, children }: {
  title: string; expanded: boolean; onToggle: () => void; children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mx-[16px] border-t border-[#EAEBEC]" />
      <button className="flex w-full items-center justify-between py-[10px] px-[16px]" onClick={onToggle}>
        <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">{title}</span>
        {expanded ? <ChevronDown className="h-[16px] w-[16px] text-[#989BA2]" /> : <ChevronRight className="h-[16px] w-[16px] text-[#989BA2]" />}
      </button>
      {expanded && children && <div className="px-[16px] pb-[12px]">{children}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 바이탈 상세 팝업
 * ────────────────────────────────────────────── */
function VitalDetailPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[560px] max-h-[80vh] rounded-[8px] bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 팝업 헤더 */}
        <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#EAEBEC]">
          <span className="text-[14px] font-bold text-[#171719]">바이탈 기록</span>
          <button onClick={onClose} className="p-[2px] text-[#989BA2] hover:text-[#171719]">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* 필터 */}
        <div className="flex items-center gap-[8px] px-[16px] py-[8px] border-b border-[#EAEBEC]">
          <span className="text-[12px] text-[#70737C]">김유비 (30 Y)</span>
          <span className="text-[12px] text-[#989BA2]">기간설정</span>
          <span className="text-[12px] text-[#989BA2]">2025-01-18</span>
          <span className="text-[12px] text-[#989BA2]">~</span>
          <span className="text-[12px] text-[#989BA2]">2026-01-18</span>
          <span className="rounded-[4px] border border-[#C2C4C8] px-[6px] py-[2px] text-[11px] text-[#70737C]">1년</span>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-[#F7F7F8] sticky top-0">
              <tr className="border-b border-[#EAEBEC]">
                <th className="py-[6px] px-[8px] text-left text-[#989BA2] font-normal">날짜</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">혈압1</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">혈압21</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">체온</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">맥박</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">혈당</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">체중</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">신장</th>
                <th className="py-[6px] px-[6px] text-center text-[#989BA2] font-normal">BMI</th>
              </tr>
            </thead>
            <tbody>
              {VITAL_HISTORY.map((row, idx) => (
                <tr key={idx} className="border-b border-[#F0F0F2] hover:bg-[#F8F8FA]">
                  <td className="py-[5px] px-[8px] text-[#70737C] whitespace-nowrap">{row.date}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.bp1 || "-"}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.bp2 || "-"}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.temp}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.pulse}</td>
                  <td className="py-[5px] px-[6px] text-center">
                    <span className="rounded-[2px] bg-[#453EDC] px-[3px] py-[0.5px] text-[9px] font-bold text-white mr-[2px]">{row.sugar}</span>
                    <span className="text-[#171719]">{row.sugarVal}</span>
                  </td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.weight || "-"}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.height || "-"}</td>
                  <td className="py-[5px] px-[6px] text-center text-[#171719]">{row.bmi || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 차트 영역 */}
        <div className="border-t border-[#EAEBEC] px-[16px] py-[12px]">
          <div className="flex items-center gap-[8px] mb-[8px]">
            <span className="rounded-[4px] border border-[#C2C4C8] px-[6px] py-[2px] text-[11px] text-[#70737C]">수축기 혈압 추이</span>
          </div>
          <div className="h-[80px] rounded-[4px] bg-[#F7F7F8] flex items-center justify-center text-[12px] text-[#989BA2]">
            체온 추이 차트 영역
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-[8px] px-[16px] py-[12px] border-t border-[#EAEBEC]">
          <button onClick={onClose} className="rounded-[6px] border border-[#C2C4C8] px-[16px] py-[6px] text-[12px] text-[#70737C]">취소</button>
          <button className="rounded-[6px] bg-[#453EDC] px-[16px] py-[6px] text-[12px] font-bold text-white">저장</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 혈당 타입 드롭다운
 * ────────────────────────────────────────────── */
function SugarTypeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="rounded-[2px] bg-[#453EDC] px-[4px] py-[1px] text-[10px] font-bold text-white hover:bg-[#3730B0]"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        {value}
      </button>
      {open && (
        <div className="absolute top-[20px] left-0 z-50 w-[56px] rounded-[6px] border border-[#EAEBEC] bg-white py-[2px] shadow-lg">
          {SUGAR_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`flex w-full px-[8px] py-[4px] text-[11px] hover:bg-[#F4F4F5] ${opt === value ? "text-[#453EDC] font-bold" : "text-[#46474C]"}`}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 메인 컴포넌트
 * ────────────────────────────────────────────── */
export default function PatientInfoPanel() {
  const [expandedSections, setExpandedSections] = useState({
    aiSummary: false, family: false, vaccine: false, allergy: false,
  });
  const [vitalPopupOpen, setVitalPopupOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [sugarType, setSugarType] = useState("PP1");
  const [vitalValues, setVitalValues] = useState<Record<string, string>>({
    bp1: "", bp2: "", temp: "36.2", pulse: "59", sugar: "116", weight: "", height: "", bmi: "",
  });
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const toggleSection = (key: keyof typeof expandedSections) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleVitalChange = (key: string, value: string) => {
    setVitalValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <CardModule widgetId="patient-info" className="w-full h-full min-w-0 rounded-[6px] border border-[#C2C4C8] bg-white overflow-hidden">
      {/* ─── 1. 환자 정보 헤더 ─── */}
      <CardHeader widgetId="patient-info">
        <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">환자 정보</span>
        <div className="flex items-center gap-[6px] ml-auto">
          {[
            { Icon: ClipboardList, title: "차트" }, { Icon: Mic, title: "AI STT" },
            { Icon: MonitorSpeaker, title: "진료 타임라인", onClick: () => setTimelineOpen(true) },
            { Icon: ImageIcon, title: "이미지" },
            { Icon: FileCheck, title: "검사뷰어" }, { Icon: Syringe, title: "주사 이력" },
            { Icon: CalendarDays, title: "예약 일정" }, { Icon: Bot, title: "AI 기능" },
          ].map(({ Icon, title, onClick }) => (
            <button key={title} className="p-[2px] text-[#70737C] hover:text-[#171719]" title={title} onClick={onClick}>
              <Icon className="h-[16px] w-[16px]" strokeWidth={1.8} />
            </button>
          ))}
          <CardMoreMenu widgetId="patient-info" />
        </div>
      </CardHeader>

      {/* ─── 스크롤 가능 영역 ─── */}
      <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
        {/* ─── 2. 환자 기본 정보 ─── */}
        <div className="flex flex-col gap-[8px] px-[16px] py-[12px]">
          <div className="flex items-center gap-[6px]">
            <div className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[#FFD4D4] shrink-0">
              <span className="text-[10px] font-bold text-[#FF4242] leading-none">N</span>
            </div>
            <span className="text-[14px] font-bold text-[#171719]">2400001</span>
            <span className="h-[12px] w-px bg-[#DBDCDF]" />
            <span className="text-[14px] font-bold text-[#171719]">김유비</span>
            <span className="h-[12px] w-px bg-[#DBDCDF]" />
            <span className="text-[13px] font-medium text-[#70737C]">(여/30)</span>
            <span className="h-[12px] w-px bg-[#DBDCDF]" />
            <span className="text-[13px] font-medium text-[#70737C]">960526-2000000</span>
          </div>
          <div className="flex items-center gap-[5px] flex-wrap">
            {/* 재 - 아웃라인 그레이 */}
            <span className="flex h-[20px] items-center rounded-[4px] border border-[#DBDCDF] bg-white px-[8px] text-[11px] font-medium text-[#70737C]">재</span>
            {/* 만 - 아웃라인 레드 */}
            <span className="flex h-[20px] items-center rounded-[4px] border border-[#FFD4D4] bg-[#FFF5F5] px-[8px] text-[11px] font-medium text-[#FF4242]">만</span>
            {/* 임산부 - 아웃라인 레드 */}
            <span className="flex h-[20px] items-center rounded-[4px] border border-[#FFD4D4] bg-[#FFF5F5] px-[8px] text-[11px] font-medium text-[#FF4242]">임산부</span>
            {/* 건보 - 아웃라인 블루 */}
            <span className="flex h-[20px] items-center rounded-[4px] border border-[#C8DEFF] bg-[#F0F5FF] px-[8px] text-[11px] font-medium text-[#378ADD]">건보</span>
            {/* 단골 - 필드 그레이 */}
            <span className="flex h-[20px] items-center rounded-[4px] bg-[#F0F0F2] px-[8px] text-[11px] font-medium text-[#70737C]">단골</span>
          </div>
        </div>

        <div className="mx-[16px] border-t border-[#EAEBEC]" />

        {/* ─── 3. 바이탈 ─── */}
        <div className="px-[16px] py-[10px]">
          <div className="flex items-center justify-between mb-[6px]">
            <div className="flex items-center gap-[6px]">
              <span className="text-[13px] font-bold text-[#171719]">바이탈</span>
              <button
                className="flex items-center gap-[2px] text-[12px] text-[#70737C] hover:text-[#453EDC]"
                onClick={() => setVitalPopupOpen(true)}
              >
                <Plus className="h-[12px] w-[12px]" />
                <span>더보기</span>
              </button>
            </div>
            <span className="text-[11px] text-[#989BA2]">(금일 측정)</span>
          </div>

          <div className="rounded-[4px] border border-[#EAEBEC] relative overflow-hidden">
            <div className="grid grid-cols-8 bg-[#F7F7F8] rounded-t-[4px]">
              {VITAL_COLUMNS.map((col) => (
                <div key={col.key} className="flex items-center justify-center py-[4px] text-[11px] text-[#989BA2]">{col.label}</div>
              ))}
            </div>
            <div className="grid grid-cols-8 border-t border-[#EAEBEC]">
              {VITAL_COLUMNS.map((col) => {
                const val = vitalValues[col.key];
                const isEditing = editingCell === col.key;
                const isSugar = col.key === "sugar";

                return (
                  <div
                    key={col.key}
                    className={`flex items-center justify-center py-[4px] text-[12px] cursor-pointer overflow-hidden min-w-0 ${isEditing ? "bg-[#F1EDFF]" : "hover:bg-[#F7F7F8]"}`}
                    onClick={() => setEditingCell(col.key)}
                  >
                    {isSugar ? (
                      <span className="flex items-center gap-[2px]">
                        <SugarTypeDropdown value={sugarType} onChange={setSugarType} />
                        {isEditing ? (
                          <input
                            autoFocus
                            className="w-[28px] bg-transparent text-center text-[12px] outline-none"
                            value={val}
                            onChange={(e) => handleVitalChange(col.key, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingCell(null)}
                          />
                        ) : (
                          <span className="text-[#171719]">{val || "-"}</span>
                        )}
                      </span>
                    ) : isEditing ? (
                      <input
                        autoFocus
                        className="w-[36px] bg-transparent text-center text-[12px] outline-none"
                        value={val}
                        onChange={(e) => handleVitalChange(col.key, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => e.key === "Enter" && setEditingCell(null)}
                      />
                    ) : (
                      <span className={val ? "text-[#171719]" : "text-[#C2C4C8]"}>{val || "-"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 4. 접수메모 (라인 1개만) ─── */}
        <div className="mx-[16px] border-t border-[#EAEBEC]" />
        <div className="px-[16px] py-[10px]">
          <h4 className="text-[13px] font-bold text-[#171719] mb-[4px]">접수메모</h4>
          <p className="text-[13px] text-[#70737C] leading-[1.5]">지난번 검진 결과 문의</p>
        </div>

        {/* ─── 5. 환자 진료이력 요약 (AI) ─── */}
        <CollapsibleSection title="환자 진료이력 요약" expanded={expandedSections.aiSummary} onToggle={() => toggleSection("aiSummary")}>
          <div className="flex items-start gap-[6px] mb-[8px]">
            <Sparkles className="h-[16px] w-[16px] text-[#453EDC] shrink-0 mt-[1px]" />
            <span className="text-[12px] text-[#453EDC] font-bold">AI 요약</span>
          </div>
          <div className="rounded-[6px] border border-[#EAEBEC] bg-[#FAFAFA] p-[12px] mb-[8px]">
            <h5 className="text-[13px] font-bold text-[#171719] mb-[8px]">환자 요약</h5>
            <ul className="flex flex-col gap-[4px] text-[12px] text-[#46474C] leading-[1.6]">
              <li className="flex gap-[6px]"><span className="text-[#989BA2] shrink-0">•</span><span>마지막 방문: 2026-03-04 (14일 전)</span></li>
              <li className="flex gap-[6px]"><span className="text-[#989BA2] shrink-0">•</span><span>고혈압, 당뇨, 고지혈증 3년 이상 관리 중</span></li>
              <li className="flex gap-[6px]"><span className="text-[#989BA2] shrink-0">•</span><span>최근 방문: 2026-02-24 정기 처방 및 혈액 검사</span></li>
              <li className="flex gap-[6px]"><span className="text-[#FF4242] shrink-0">•</span><span className="text-[#FF4242]">HbA1c 3회 연속 상승 (7.2% &gt; 7.8% &gt; 8.1%), 당뇨 합병증 진행 위험</span></li>
            </ul>
          </div>
          <div className="rounded-[6px] border border-[#EAEBEC] bg-[#FAFAFA] p-[12px] mb-[8px]">
            <h5 className="text-[13px] font-bold text-[#171719] mb-[8px]">처방금지 약물</h5>
            <ul className="flex flex-col gap-[4px] text-[12px] text-[#46474C] leading-[1.6]">
              <li className="flex gap-[6px]"><span className="text-[#989BA2] shrink-0">•</span><span>NSAIDs 주의 - 신기능 저하 (eGFR 62)</span></li>
              <li className="flex gap-[6px]"><span className="text-[#989BA2] shrink-0">•</span><span>아스피린 + 와파린 병용 금기</span></li>
            </ul>
          </div>
          <div className="rounded-[6px] border border-[#EAEBEC] bg-[#FAFAFA] p-[12px]">
            <h5 className="text-[13px] font-bold text-[#171719] mb-[10px]">핵심 수치</h5>
            <div className="grid grid-cols-2 gap-[8px]">
              {KEY_METRICS.map((m) => (
                <div key={m.label} className="rounded-[6px] border border-[#EAEBEC] bg-white p-[10px] flex flex-col gap-[4px]">
                  <span className="text-[11px] text-[#989BA2]">{m.label}</span>
                  <span className={`text-[20px] font-bold leading-[1.2] ${m.valueColor}`}>{m.value}</span>
                  <span className={`text-[11px] ${m.alertColor}`}>{m.alert}</span>
                  <div className="flex gap-[2px] h-[6px] mt-[2px]">
                    {m.bars.map((b, i) => <div key={i} className={`flex-1 rounded-[2px] ${b.c}`} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>

        {/* ─── 6~8. 등록된 가족 / 예방접종 / 알레르기 ─── */}
        <CollapsibleSection title="등록된 가족" expanded={expandedSections.family} onToggle={() => toggleSection("family")}>
          <p className="text-[12px] text-[#989BA2]">등록된 가족이 없습니다</p>
        </CollapsibleSection>
        <CollapsibleSection title="예방접종" expanded={expandedSections.vaccine} onToggle={() => toggleSection("vaccine")}>
          <p className="text-[12px] text-[#989BA2]">이력 없음</p>
        </CollapsibleSection>
        <CollapsibleSection title="알레르기" expanded={expandedSections.allergy} onToggle={() => toggleSection("allergy")}>
          <p className="text-[12px] text-[#989BA2]">등록된 알레르기 정보가 없습니다</p>
        </CollapsibleSection>

        <div className="h-[16px] shrink-0" />
      </div>

      {/* 바이탈 상세 팝업 */}
      {vitalPopupOpen && <VitalDetailPopup onClose={() => setVitalPopupOpen(false)} />}

      {/* 진료 타임라인 팝업 */}
      {timelineOpen && <ConsultationTimeline onClose={() => setTimelineOpen(false)} />}
    </CardModule>
  );
}
