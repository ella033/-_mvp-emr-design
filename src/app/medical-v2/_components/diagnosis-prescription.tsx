"use client";

import React, { useState } from "react";
import { Search, MoreVertical, Pencil, ChevronDown, X } from "lucide-react";
import CardMoreMenu from "./layout/card-more-menu";
import CardHeader from "./layout/card-header";
import CardModule from "./layout/card-module";

/* ──────────────────────────────────────────────
 * 상병 데이터
 * ────────────────────────────────────────────── */
const DISEASE_COLUMNS = [
  { key: "sort", label: "≡", width: "w-[28px]" },
  { key: "code", label: "코드", width: "w-[80px]" },
  { key: "name", label: "상병 명칭", width: "flex-1" },
  { key: "type", label: "의증", width: "w-[36px]" },
  { key: "left", label: "좌", width: "w-[28px]" },
  { key: "right", label: "우", width: "w-[28px]" },
  { key: "incomplete", label: "불완전상병", width: "w-[70px]" },
  { key: "special", label: "특정기호", width: "w-[56px]" },
  { key: "dept", label: "진료과", width: "w-[50px]" },
];

const DISEASE_DATA = [
  { code: "B660", name: "급성비인두염", dept: "진료과" },
  { code: "B85600", name: "민성기관지염", dept: "-" },
  { code: "A001000", name: "비브리오 콜레라 01", dept: "-" },
  { code: "parati013", name: "파라티푸스 B Paratyphi", dept: "-" },
];

/* ──────────────────────────────────────────────
 * 처방 데이터
 * ────────────────────────────────────────────── */
const ORDER_COLUMNS = [
  { key: "sort", label: "≡", width: "w-[28px]" },
  { key: "code", label: "코드", width: "w-[72px]" },
  { key: "name", label: "처방 명칭", width: "flex-1" },
  { key: "dose", label: "용량", width: "w-[32px]" },
  { key: "daily", label: "일투", width: "w-[32px]" },
  { key: "days", label: "일수", width: "w-[32px]" },
  { key: "method", label: "용법", width: "w-[42px]" },
  { key: "exception", label: "예외", width: "w-[36px]" },
  { key: "claim", label: "청구", width: "w-[32px]" },
  { key: "receipt", label: "수납", width: "w-[28px]" },
  { key: "check", label: "검체", width: "w-[36px]" },
  { key: "price", label: "단가", width: "w-[52px]" },
];

const ORDER_DATA = [
  { code: "ro022", name: "접종", dose: "1", daily: "1", days: "1", method: "가려...", exception: "원외", claim: "청", receipt: "보", check: "", price: "2,000" },
  { code: "trajen", name: "트라젠타정5mg", dose: "1", daily: "1", days: "1", method: "", exception: "20", claim: "청", receipt: "보", check: "", price: "162,24" },
  { code: "985145", name: "물리치료", dose: "1", daily: "1", days: "1", method: "#20", exception: "10", claim: "비", receipt: "보", check: "", price: "3,600", claimColor: "text-[#FF4242]" },
  { code: "660045", name: "푸르설타민주(마늘주사)", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "1,000" },
  { code: "A0015", name: "암브록솔염산염·클렌부테롤...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
  { code: "tm0001", name: "텔미사르탄·암로디핀베실산...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "100", price: "2,500", checkColor: "text-[#FF4242]" },
  { code: "Placehol", name: "클로르페니라민말레산염·슈...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
  { code: "456", name: "비라토비캡슐75밀리그램(엔...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
  { code: "reb500", name: "레비라정500밀리그램(레비...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
  { code: "cro000", name: "클로르페니라민말레산염·슈...", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
  { code: "Placehol...", name: "클로르페니라민", dose: "1", daily: "1", days: "1", method: "1일...", exception: "18", claim: "청", receipt: "보", check: "", price: "2,500" },
];

/* ──────────────────────────────────────────────
 * 메인 컴포넌트
 * ────────────────────────────────────────────── */
const SEARCH_RESULTS = [
  { code: "J00", name: "급성 비인두염[감기]", type: "상병" },
  { code: "J06.9", name: "급성 상기도감염, 상세불명", type: "상병" },
  { code: "J20.9", name: "급성 기관지염, 상세불명", type: "상병" },
  { code: "ro022", name: "접종", type: "처방" },
  { code: "trajen", name: "트라젠타정5mg", type: "처방" },
  { code: "A0015", name: "암브록솔염산염·클렌부테롤정", type: "처방" },
  { code: "K29.5", name: "만성 위염, 상세불명", type: "상병" },
  { code: "I10", name: "본태성(일차성) 고혈압", type: "상병" },
];

export default function DiagnosisPrescription() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredResults = searchTerm.length > 0
    ? SEARCH_RESULTS.filter(
        (r) =>
          r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <CardModule widgetId="diagnosis-prescription" className="w-full h-full rounded-[6px] border border-[#C2C4C8] bg-white overflow-hidden min-w-0">
      {/* ─── 헤더 ─── */}
      <CardHeader widgetId="diagnosis-prescription">
        <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
          진단 및 처방
        </span>
        <div className="flex items-center gap-[4px] ml-auto">
          <button className="p-[2px] text-[#70737C] hover:text-[#171719]">
            <Pencil className="h-[14px] w-[14px]" />
          </button>
          <CardMoreMenu widgetId="diagnosis-prescription" />
        </div>
      </CardHeader>

      {/* ─── 검색 ─── */}
      <div className="relative">
        <div className="flex items-center gap-[6px] border-b border-[#EAEBEC] px-[10px] py-[6px]">
          <Search className="h-[14px] w-[14px] text-[#989BA2]" />
          <input
            type="text"
            placeholder="상병 및 처방 전체 검색"
            className="flex-1 text-[12px] text-[#171719] placeholder-[#C2C4C8] outline-none bg-transparent font-['Spoqa_Han_Sans_Neo',sans-serif]"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSearchResults(true); }}
            onFocus={() => searchTerm.length > 0 && setShowSearchResults(true)}
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(""); setShowSearchResults(false); }} className="text-[#989BA2]">
              <X className="h-[12px] w-[12px]" />
            </button>
          )}
        </div>

        {/* 검색 결과 드롭다운 */}
        {showSearchResults && filteredResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 max-h-[200px] overflow-y-auto rounded-b-[6px] border border-t-0 border-[#EAEBEC] bg-white shadow-lg">
            {filteredResults.map((r, idx) => (
              <button
                key={idx}
                className="flex w-full items-center gap-[8px] px-[12px] py-[6px] text-[12px] hover:bg-[#F1EDFF] transition-colors"
                onClick={() => { setSearchTerm(""); setShowSearchResults(false); }}
              >
                <span className={`shrink-0 rounded-[4px] px-[4px] py-[1px] text-[10px] font-bold ${
                  r.type === "상병" ? "bg-[#EAF2FE] text-[#0066FF]" : "bg-[#EDF8EF] text-[#2EA652]"
                }`}>
                  {r.type}
                </span>
                <span className="text-[#453EDC]">{r.code}</span>
                <span className="text-[#171719] truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── 상병 그리드 (가로 스크롤) ─── */}
      <div className="flex flex-col shrink-0 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-[#F7F7F8] border-b border-[#EAEBEC]">
              <th className="h-[24px] w-[28px] text-[11px] font-normal text-[#989BA2] text-center">≡</th>
              <th className="h-[24px] w-[80px] text-[11px] font-normal text-[#989BA2] text-center px-[4px]">코드</th>
              <th className="h-[24px] text-[11px] font-normal text-[#989BA2] text-left px-[4px]">상병 명칭</th>
              <th className="h-[24px] w-[36px] text-[11px] font-normal text-[#989BA2] text-center">의증</th>
              <th className="h-[24px] w-[28px] text-[11px] font-normal text-[#989BA2] text-center">좌</th>
              <th className="h-[24px] w-[28px] text-[11px] font-normal text-[#989BA2] text-center">우</th>
              <th className="h-[24px] w-[70px] text-[11px] font-normal text-[#989BA2] text-center">불완전상병</th>
              <th className="h-[24px] w-[56px] text-[11px] font-normal text-[#989BA2] text-center">특정기호</th>
              <th className="h-[24px] w-[50px] text-[11px] font-normal text-[#989BA2] text-center">진료과</th>
            </tr>
          </thead>
          <tbody>
            {DISEASE_DATA.map((disease, idx) => (
              <tr key={idx} className="h-[24px] border-b border-[#F0F0F2] hover:bg-[#F8F8FA] cursor-pointer">
                <td className="text-[11px] text-[#C2C4C8] text-center" />
                <td className="px-[4px] text-[12px] text-[#171719] truncate">{disease.code}</td>
                <td className="px-[4px] text-[12px] text-[#171719] truncate max-w-0">{disease.name}</td>
                <td className="text-center"><RoundCheckbox /></td>
                <td className="text-center"><RoundCheckbox /></td>
                <td className="text-center"><RoundCheckbox /></td>
                <td className="text-[12px] text-[#989BA2] text-center">-</td>
                <td className="text-[12px] text-[#989BA2] text-center" />
                <td className="text-[12px] text-[#989BA2] text-center">{disease.dept}</td>
              </tr>
            ))}
            {/* 입력 행 */}
            <tr className="h-[24px] border-b border-[#EAEBEC]">
              <td />
              <td className="px-[4px]"><span className="text-[11px] text-[#C2C4C8]">코드</span></td>
              <td className="px-[4px]"><span className="text-[11px] text-[#C2C4C8]">명칭</span></td>
              <td colSpan={6} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ─── 처방 그리드 (가로 스크롤) ─── */}
      <div className="flex flex-1 flex-col min-h-0">
        <div className="overflow-x-auto flex-1">
          <table className="w-full min-w-[680px] border-collapse">
            <thead className="sticky top-0 z-[2]">
              <tr className="bg-[#F7F7F8] border-b border-[#EAEBEC]">
                <th className="h-[24px] w-[28px] text-[11px] font-normal text-[#989BA2] text-center">≡</th>
                <th className="h-[24px] w-[72px] text-[11px] font-normal text-[#989BA2] text-center px-[4px]">코드</th>
                <th className="h-[24px] text-[11px] font-normal text-[#989BA2] text-left px-[4px]">처방 명칭</th>
                <th className="h-[24px] w-[32px] text-[11px] font-normal text-[#989BA2] text-center">용량</th>
                <th className="h-[24px] w-[32px] text-[11px] font-normal text-[#989BA2] text-center">일투</th>
                <th className="h-[24px] w-[32px] text-[11px] font-normal text-[#989BA2] text-center">일수</th>
                <th className="h-[24px] w-[42px] text-[11px] font-normal text-[#989BA2] text-center">용법</th>
                <th className="h-[24px] w-[36px] text-[11px] font-normal text-[#989BA2] text-center">예외</th>
                <th className="h-[24px] w-[32px] text-[11px] font-normal text-[#989BA2] text-center">청구</th>
                <th className="h-[24px] w-[28px] text-[11px] font-normal text-[#989BA2] text-center">수납</th>
                <th className="h-[24px] w-[36px] text-[11px] font-normal text-[#989BA2] text-center">검체</th>
                <th className="h-[24px] w-[52px] text-[11px] font-normal text-[#989BA2] text-right px-[4px]">단가</th>
              </tr>
            </thead>
            <tbody>
              {ORDER_DATA.map((order, idx) => (
                <tr key={idx} className="h-[24px] border-b border-[#F0F0F2] hover:bg-[#F8F8FA] cursor-pointer">
                  <td className="text-[11px] text-[#C2C4C8] text-center">{idx === 0 ? "▼" : "├"}</td>
                  <td className="px-[4px] text-[12px] text-[#171719] truncate">{order.code}</td>
                  <td className="px-[4px] text-[12px] text-[#171719] truncate max-w-0">{order.name}</td>
                  <td className="text-[12px] text-[#171719] text-center">{order.dose}</td>
                  <td className="text-[12px] text-[#171719] text-center">{order.daily}</td>
                  <td className="text-[12px] text-[#171719] text-center">{order.days}</td>
                  <td className="text-[12px] text-[#171719] text-center truncate">{order.method}</td>
                  <td className="text-[12px] text-[#171719] text-center">{order.exception}</td>
                  <td className={`text-[12px] text-center ${(order as any).claimColor || "text-[#171719]"}`}>{order.claim}</td>
                  <td className="text-[12px] text-[#171719] text-center">{order.receipt}</td>
                  <td className={`text-[12px] text-center ${(order as any).checkColor || "text-[#171719]"}`}>{order.check}</td>
                  <td className="px-[4px] text-[12px] text-[#989BA2] text-right">{order.price}</td>
                </tr>
              ))}
              {/* 입력 행 */}
              <tr className="h-[24px] border-b border-[#EAEBEC]">
                <td />
                <td className="px-[4px]"><span className="text-[11px] text-[#C2C4C8]">코드</span></td>
                <td className="px-[4px]"><span className="text-[11px] text-[#C2C4C8]">명칭</span></td>
                <td colSpan={9} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 하단 퀵 액션 바 ─── */}
      <div className="flex items-center gap-[6px] border-t border-[#EAEBEC] px-[10px] py-[5px] bg-white shrink-0">
        <QuickAction label="조제메모" />
        <QuickAction label="예약처방" count={12} highlight />
        <QuickAction label="특정내역" />
        <QuickAction label="환자예외" />
        <QuickAction label="처방금지" />
        <div className="flex-1" />
        <span className="text-[13px] font-bold text-[#171719]">83,000원</span>
        <span className="text-[12px] text-[#989BA2]">24,000원</span>
      </div>

      {/* ─── 하단 진료 액션 바 ─── */}
      <div className="flex items-center gap-[4px] border-t border-[#EAEBEC] px-[10px] py-[5px] bg-white shrink-0">
        <DropdownBtn label="초진" />
        <DropdownBtn label="청구" />
        <DropdownBtn label="주간" />
        <DropdownBtn label="외래치료종결" />
        <div className="flex-1" />
        {/* Outline */}
        <button className="rounded-[6px] border border-[#C2C4C8] bg-white px-[12px] py-[4px] text-[12px] font-bold text-[#46474C] hover:bg-[#F4F4F5] active:border-[#7C5CFA] transition-colors">
          저장
        </button>
        {/* Secondary */}
        <button className="rounded-[6px] bg-[#F1EDFF] px-[12px] py-[4px] text-[12px] font-bold text-[#453EDC] hover:brightness-95 transition-colors">
          저장전달
        </button>
        {/* Primary */}
        <button className="rounded-[6px] bg-[#453EDC] px-[12px] py-[4px] text-[12px] font-bold text-white hover:brightness-90 transition-colors">
          출력전달
        </button>
      </div>
    </CardModule>
  );
}

function QuickAction({ label, count, highlight }: { label: string; count?: number; highlight?: boolean }) {
  return (
    <button className={`flex items-center gap-[3px] px-[6px] py-[2px] rounded-[4px] text-[11px] transition-colors ${highlight ? "bg-[#F1EDFF] text-[#453EDC] font-bold" : "text-[#70737C] hover:bg-[#F4F4F5]"}`}>
      <span>{label}</span>
      {count !== undefined && (
        <span className="rounded-[8px] bg-[#453EDC] px-[5px] py-[0.5px] text-[10px] font-bold text-white">{count}</span>
      )}
    </button>
  );
}

function DropdownBtn({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-[2px] rounded-[6px] border border-[#C2C4C8] bg-white px-[8px] py-[3px] text-[11px] text-[#171719] hover:bg-[#F4F4F5] transition-colors">
      <span>{label}</span>
      <ChevronDown className="h-[10px] w-[10px] text-[#989BA2]" />
    </button>
  );
}

/** 라운드 체크박스 (의증/좌/우용) */
function RoundCheckbox() {
  const [checked, setChecked] = useState(false);
  return (
    <button
      className={`inline-flex h-[14px] w-[14px] items-center justify-center rounded-[3px] border transition-colors ${
        checked ? "bg-[#453EDC] border-[#453EDC]" : "border-[#C2C4C8] bg-white hover:border-[#989BA2]"
      }`}
      onClick={(e) => { e.stopPropagation(); setChecked(!checked); }}
    >
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
