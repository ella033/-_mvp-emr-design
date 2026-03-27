"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Check, FileText, X } from "lucide-react";
import CardMoreMenu from "./layout/card-more-menu";
import CardHeader from "./layout/card-header";
import CardModule from "./layout/card-module";

export default function ClinicalMemoSymptoms() {
  const [activeTab, setActiveTab] = useState<"clinic" | "patient">("clinic");
  const [clinicMemo, setClinicMemo] = useState(
    "고혈압 정기처방 3종\n위염약 2종\n\n혈액검사 (간기능, 신기능, 혈당)\n\n주기적인 고혈압 관찰 필요\n\n해외출장으로 약 2주치 처방을 원함"
  );
  const [patientMemo, setPatientMemo] = useState("");
  const [symptomText, setSymptomText] = useState(
    "3일 전부터 목 아프고 기침 심함. 열감 있음. 콧물, 가래 동반."
  );

  /* ─── 고정 공지 상태 ─── */
  const [pinnedText, setPinnedText] = useState("한 달 주기로 고혈압약 복용을...");
  const [pinnedDraft, setPinnedDraft] = useState("");
  const [isPinnedEditing, setIsPinnedEditing] = useState(false);
  const [hasPinned, setHasPinned] = useState(true);
  const pinnedInputRef = useRef<HTMLInputElement>(null);

  const startPinnedEdit = () => {
    setPinnedDraft(pinnedText);
    setIsPinnedEditing(true);
    setTimeout(() => pinnedInputRef.current?.focus(), 50);
  };

  const savePinned = () => {
    const trimmed = pinnedDraft.trim();
    if (trimmed === "") {
      // 전체 삭제 시 고정내용 셀 제거
      setHasPinned(false);
      setPinnedText("");
    } else {
      setPinnedText(trimmed);
    }
    setIsPinnedEditing(false);
  };

  const handlePinnedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") savePinned();
    if (e.key === "Escape") setIsPinnedEditing(false);
  };

  return (
    <div className="flex w-full h-full flex-col gap-[6px] overflow-hidden">
      {/* ─── 임상메모 / 환자메모 패널 ─── */}
      <CardModule widgetId="clinical-memo" className="flex-1 rounded-[6px] border border-[#C2C4C8] bg-white min-h-0">
        {/* 탭 헤더 */}
        <CardHeader widgetId="clinical-memo">
          <div className="flex h-full items-center">
            <button
              className={`flex h-full items-center justify-center px-[12px] text-[13px] font-['Spoqa_Han_Sans_Neo',sans-serif] relative ${
                activeTab === "clinic"
                  ? "font-bold text-[#180f38]"
                  : "text-[#989BA2]"
              }`}
              onClick={() => setActiveTab("clinic")}
            >
              임상메모
              {activeTab === "clinic" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#180f38]" />
              )}
            </button>
            <button
              className={`flex h-full items-center justify-center px-[12px] text-[13px] font-['Spoqa_Han_Sans_Neo',sans-serif] relative ${
                activeTab === "patient"
                  ? "font-bold text-[#180f38]"
                  : "text-[#989BA2]"
              }`}
              onClick={() => setActiveTab("patient")}
            >
              환자메모
              {activeTab === "patient" && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#180f38]" />
              )}
            </button>
          </div>
          <div className="ml-auto pr-[6px]">
            <CardMoreMenu widgetId="clinical-memo" />
          </div>
        </CardHeader>

        {/* 고정 공지 */}
        {hasPinned && (
          <div className={`flex items-center gap-[6px] mx-[8px] mt-[8px] rounded-[6px] px-[8px] py-[5px] ${
            isPinnedEditing ? "bg-white border border-[#453EDC]" : "bg-[#EAF2FE] border border-transparent"
          }`}>
            {isPinnedEditing ? (
              <>
                <input
                  ref={pinnedInputRef}
                  className="flex-1 min-w-0 text-[12px] text-[#171719] bg-transparent outline-none"
                  value={pinnedDraft}
                  onChange={(e) => setPinnedDraft(e.target.value)}
                  onKeyDown={handlePinnedKeyDown}
                  placeholder="공지 내용 입력 (비우면 삭제)"
                />
                <button
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] bg-[#453EDC] text-white shrink-0 hover:bg-[#3730B0]"
                  onClick={savePinned}
                  title="저장"
                >
                  <Check className="h-[10px] w-[10px]" strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-[12px] text-[#46474C] truncate">{pinnedText}</span>
                <button
                  className="shrink-0 text-[#989BA2] hover:text-[#453EDC]"
                  onClick={startPinnedEdit}
                  title="편집"
                >
                  <Pencil className="h-[12px] w-[12px]" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 프리텍스트 입력 영역 */}
        <div className="flex-1 min-h-0 p-[8px]">
          {activeTab === "clinic" ? (
            <textarea
              className="h-full w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8] font-['Spoqa_Han_Sans_Neo',sans-serif]"
              value={clinicMemo}
              onChange={(e) => setClinicMemo(e.target.value)}
              placeholder="임상메모를 입력하세요..."
            />
          ) : (
            <textarea
              className="h-full w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8] font-['Spoqa_Han_Sans_Neo',sans-serif]"
              value={patientMemo}
              onChange={(e) => setPatientMemo(e.target.value)}
              placeholder="환자메모를 입력하세요..."
            />
          )}
        </div>
      </CardModule>

      {/* ─── 증상 패널 ─── */}
      <CardModule widgetId="symptom" className="flex-1 rounded-[6px] border border-[#C2C4C8] bg-white min-h-0">
        {/* 증상 헤더 */}
        <CardHeader widgetId="symptom">
          <span className="text-[13px] font-bold text-[#171719] font-['Spoqa_Han_Sans_Neo',sans-serif]">
            증상
          </span>
          <div className="ml-auto">
            <CardMoreMenu widgetId="symptom" />
          </div>
        </CardHeader>

        {/* 증상 프리텍스트 입력 */}
        <div className="flex flex-1 flex-col p-[8px] min-h-0">
          <textarea
            className="flex-1 w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8] font-['Spoqa_Han_Sans_Neo',sans-serif]"
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            placeholder="증상을 입력하세요..."
          />

          {/* 질병코드 배지 */}
          <div className="flex items-center gap-[4px] pt-[6px] mt-auto shrink-0 border-t border-[#EAEBEC]">
            <span className="rounded-[4px] border border-[#C2C4C8] bg-white px-[6px] py-[2px] text-[12px] text-[#70737C] font-['Spoqa_Han_Sans_Neo',sans-serif]">
              A39
            </span>
            <span className="rounded-[4px] border border-[#C2C4C8] bg-white px-[6px] py-[2px] text-[12px] text-[#70737C] font-['Spoqa_Han_Sans_Neo',sans-serif]">
              A40
            </span>
            <span className="rounded-[4px] border border-[#C2C4C8] bg-white px-[6px] py-[2px] text-[12px] text-[#70737C] font-['Spoqa_Han_Sans_Neo',sans-serif]">
              J2431
            </span>
          </div>
        </div>
      </CardModule>
    </div>
  );
}
