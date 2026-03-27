"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Columns,
  Calendar,
  ExternalLink,
  Lightbulb,
  Image as ImageIcon,
} from "lucide-react";

/* ──────────────────────────────────────────────
 * 상세 데이터 타입
 * ────────────────────────────────────────────── */
interface DetailField { label: string; value: string; highlight?: boolean }
interface DetailImage { src: string; title: string }

interface TimelineItemDetail {
  category: string;
  categoryColor: string;
  period: string;
  title: string;
  fields: DetailField[];
  aiNote?: string;
  images?: DetailImage[];
}

/* ──────────────────────────────────────────────
 * 바/포인트 공통
 * ────────────────────────────────────────────── */
interface TimelineBar {
  id: string;
  label: string;
  startMonth: number;
  durationMonths: number;
  color: string;
  detail: TimelineItemDetail;
}

interface TimelinePoint {
  id: string;
  label?: string;
  month: number;
  color: string;
  icon: "dot" | "badge" | "circle";
  detail?: TimelineItemDetail;
}

interface TimelineRow {
  category: string;
  type: "bar" | "point";
  items: (TimelineBar | TimelinePoint)[];
}

/* ──────────────────────────────────────────────
 * 데이터 (52개월: 2023.03 ~ 2027.06)
 * ────────────────────────────────────────────── */
const START_YEAR = 2023;
const START_MONTH = 3;
const TOTAL_MONTHS = 52;

const DATA: TimelineRow[] = [
  {
    category: "진단", type: "bar",
    items: [
      { id: "d1", label: "본태성 고혈압 (I10)", startMonth: 2, durationMonths: 50, color: "#7C5CFA",
        detail: { category: "진단", categoryColor: "#7C5CFA", period: "2023.05 ~ 현재", title: "본태성 고혈압 (I10)",
          fields: [{ label: "진단일", value: "2023년 5월 12일" }, { label: "담당의", value: "이정민 과장" }, { label: "중증도", value: "Stage 2 (140~159/90~99)" }],
          aiNote: "혈압 조절 양호. 부종 등 부작용 관찰 없음." }},
      { id: "d2", label: "제2형 당뇨병 (E11)", startMonth: 7, durationMonths: 45, color: "#453EDC",
        detail: { category: "진단", categoryColor: "#453EDC", period: "2023.10 ~ 현재", title: "제2형 당뇨병 (E11)",
          fields: [{ label: "진단일", value: "2023년 10월 5일" }, { label: "담당의", value: "이정민 과장" }, { label: "HbA1c 최근", value: "8.1% (↑)", highlight: true }],
          aiNote: "HbA1c 3회 연속 상승. 약제 증량 또는 추가 고려." }},
    ] as TimelineBar[],
  },
  {
    category: "상병", type: "bar",
    items: [
      { id: "s1", label: "급성 위장염", startMonth: 4, durationMonths: 1, color: "#F57010",
        detail: { category: "상병", categoryColor: "#F57010", period: "2023.07", title: "급성 위장염 (K29.1)",
          fields: [{ label: "증상", value: "복통, 구토, 설사" }, { label: "치료", value: "수액 + 항구토제" }, { label: "경과", value: "3일 내 호전" }] }},
      { id: "s2", label: "요로감염", startMonth: 13, durationMonths: 1, color: "#F57010",
        detail: { category: "상병", categoryColor: "#F57010", period: "2024.04", title: "요로감염 (N39.0)",
          fields: [{ label: "증상", value: "배뇨통, 빈뇨" }, { label: "치료", value: "시프로플록사신 7일" }, { label: "검사", value: "소변배양 E.coli 확인" }] }},
      { id: "s3", label: "대상포진", startMonth: 21, durationMonths: 2, color: "#F57010",
        detail: { category: "상병", categoryColor: "#F57010", period: "2024.12 ~ 2025.01", title: "대상포진 (B02.9)",
          fields: [{ label: "부위", value: "좌측 흉부 T5-T6" }, { label: "치료", value: "발라시클로비르 7일" }, { label: "후유증", value: "대상포진후신경통 (2주간)" }] }},
    ] as TimelineBar[],
  },
  {
    category: "투약", type: "bar",
    items: [
      // 아모디핀: 계속 복용
      { id: "m1", label: "아모디핀 5mg", startMonth: 2, durationMonths: 50, color: "#2EA652",
        detail: { category: "투약", categoryColor: "#2EA652", period: "2023.05 ~ 현재", title: "아모디핀정 5mg",
          fields: [{ label: "용법", value: "1일 1회 아침 식후" }, { label: "효능", value: "CCB (칼슘채널차단제) - 혈압 강하" }, { label: "처방의", value: "이정민 과장" }],
          aiNote: "혈압 조절 양호. 부종 등 부작용 관찰 없음." }},
      // 메트포르민: 계속 복용
      { id: "m2", label: "메트포르민 500mg", startMonth: 7, durationMonths: 45, color: "#45B5AA",
        detail: { category: "투약", categoryColor: "#45B5AA", period: "2023.10 ~ 현재", title: "메트포르민정 500mg",
          fields: [{ label: "용법", value: "1일 2회 아침·저녁 식후" }, { label: "효능", value: "비구아니드계 - 혈당 강하" }, { label: "처방의", value: "이정민 과장" }],
          aiNote: "위장관 부작용 초기 경미, 현재 적응 완료." }},
      // 아토르바스타틴: 3개월 복용 → 3개월 중단 → 다시 복용 (분절 표현)
      { id: "m3a", label: "아토르바스타틴 20mg", startMonth: 10, durationMonths: 6, color: "#378ADD",
        detail: { category: "투약", categoryColor: "#378ADD", period: "2024.01 ~ 2024.06", title: "아토르바스타틴정 20mg (1차)",
          fields: [{ label: "용법", value: "1일 1회 저녁 식후" }, { label: "효능", value: "HMG-CoA 환원효소 억제제 - 콜레스테롤 저하" }, { label: "처방의", value: "이정민 과장" }, { label: "비고", value: "근육통 호소로 일시 중단" }] }},
      { id: "m3b", label: "아토르바스타틴 20mg", startMonth: 19, durationMonths: 33, color: "#378ADD",
        detail: { category: "투약", categoryColor: "#378ADD", period: "2024.10 ~ 현재", title: "아토르바스타틴정 20mg (재개)",
          fields: [{ label: "용법", value: "1일 1회 저녁 식후" }, { label: "효능", value: "HMG-CoA 환원효소 억제제 - 콜레스테롤 저하" }, { label: "처방의", value: "이정민 과장" }, { label: "비고", value: "근육통 소실 확인 후 재투여" }] }},
      // 클로피도그렐
      { id: "m4", label: "클로피도그렐 75mg", startMonth: 24, durationMonths: 28, color: "#7C5CFA",
        detail: { category: "투약", categoryColor: "#7C5CFA", period: "2025.03 ~ 현재", title: "클로피도그렐정 75mg",
          fields: [{ label: "용법", value: "1일 1회 아침" }, { label: "효능", value: "항혈소판제 - 혈전 예방" }, { label: "처방사유", value: "심혈관 위험인자 다수 보유" }] }},
      // 오메프라졸
      { id: "m5", label: "오메프라졸 20mg", startMonth: 25, durationMonths: 27, color: "#9B8AFB",
        detail: { category: "투약", categoryColor: "#9B8AFB", period: "2025.04 ~ 현재", title: "오메프라졸캡슐 20mg",
          fields: [{ label: "용법", value: "1일 1회 아침 식전" }, { label: "효능", value: "PPI (양성자펌프억제제) - 위산 억제" }, { label: "처방사유", value: "항혈소판제 병용에 따른 위 보호" }] }},
      // 프레드니솔론: 대상포진 때 단기 복용 후 중단
      { id: "m6", label: "발라시클로비르 500mg", startMonth: 21, durationMonths: 1, color: "#F57010",
        detail: { category: "투약", categoryColor: "#F57010", period: "2024.12", title: "발라시클로비르정 500mg",
          fields: [{ label: "용법", value: "1일 3회 × 7일" }, { label: "효능", value: "항바이러스제 - 대상포진 치료" }, { label: "처방의", value: "이정민 과장" }, { label: "비고", value: "대상포진 치료 후 종료" }] }},
    ] as TimelineBar[],
  },
  {
    category: "검사", type: "point",
    items: [
      { id: "t1", label: "혈액", month: 3, color: "#F57010", icon: "badge" as const,
        detail: { category: "검사", categoryColor: "#F57010", period: "2023.06", title: "기본 혈액검사",
          fields: [{ label: "WBC", value: "6,800 /μL (정상)" }, { label: "Hb", value: "14.2 g/dL (정상)" }, { label: "PLT", value: "245,000 /μL (정상)" }],
          aiNote: "전반적 혈액수치 정상 범위." }},
      { id: "t2", label: "HbA1c", month: 9, color: "#F57010", icon: "badge" as const,
        detail: { category: "검사", categoryColor: "#F57010", period: "2023.12", title: "HbA1c + 생화학",
          fields: [{ label: "HbA1c", value: "7.2% (↑)", highlight: true }, { label: "공복혈당", value: "128 mg/dL (↑)", highlight: true }, { label: "LDL-C", value: "142 mg/dL (↑)", highlight: true }, { label: "Cr", value: "0.8 mg/dL (정상)" }],
          aiNote: "초기 당뇨 지표. 생활습관 교정 + 약물 시작." }},
      { id: "t3", month: 14, color: "#2EA652", icon: "circle" as const,
        detail: { category: "검사", categoryColor: "#2EA652", period: "2024.05", title: "정기 검사",
          fields: [{ label: "HbA1c", value: "6.9% (경계)" }, { label: "eGFR", value: "72 mL/min (정상)" }],
          aiNote: "당화혈색소 개선 추세." }},
      { id: "t4", month: 18, color: "#2EA652", icon: "circle" as const },
      { id: "t5", label: "정기", month: 24, color: "#F57010", icon: "badge" as const,
        detail: { category: "검사", categoryColor: "#F57010", period: "2024.12", title: "HbA1c + 생화학",
          fields: [{ label: "HbA1c", value: "7.3% (↑)", highlight: true }, { label: "공복혈당", value: "130 mg/dL (↑)", highlight: true }, { label: "LDL-C", value: "125 mg/dL (↑)", highlight: true }, { label: "Cr", value: "0.9 mg/dL (정상)" }],
          aiNote: "정기 검사. 혈당 다소 개선 중.",
          images: [{ src: "/images/xray-chest.jpg", title: "흉부 X-ray (정면)" }, { src: "/images/ecg.jpg", title: "ECG 심전도" }] }},
      { id: "t6", month: 30, color: "#2EA652", icon: "circle" as const },
    ] as TimelinePoint[],
  },
  {
    category: "접종", type: "point",
    items: [
      { id: "v1", label: "인플루엔자", month: 6, color: "#45B5AA", icon: "badge" as const,
        detail: { category: "접종", categoryColor: "#45B5AA", period: "2023.09", title: "인플루엔자 예방접종 (4가)",
          fields: [{ label: "백신", value: "테라텍트프리필드시린지 (4가)" }, { label: "접종 부위", value: "좌측 삼각근" }, { label: "접종 사유", value: "65세 이상, 당뇨 환자" }] }},
      { id: "v2", label: "폐렴구균", month: 16, color: "#45B5AA", icon: "badge" as const,
        detail: { category: "접종", categoryColor: "#45B5AA", period: "2024.04", title: "폐렴구균 예방접종 (23가)",
          fields: [{ label: "백신", value: "PPSV23 (폐렴구균 23가 다당질)" }, { label: "접종 부위", value: "좌측 삼각근" }, { label: "접종 사유", value: "65세 이상, 당뇨 환자" }, { label: "이상반응", value: "접종 부위 경미한 통증 (1일)" }] }},
      { id: "v3", label: "인플루엔자", month: 30, color: "#45B5AA", icon: "badge" as const,
        detail: { category: "접종", categoryColor: "#45B5AA", period: "2025.09", title: "인플루엔자 예방접종 (4가)",
          fields: [{ label: "백신", value: "테라텍트프리필드시린지 (4가)" }, { label: "접종 부위", value: "우측 삼각근" }, { label: "이상반응", value: "없음" }] }},
    ] as TimelinePoint[],
  },
  {
    category: "내원", type: "point",
    items: ([2,4,6,9,11,13,15,17,19,21,24,27,30,33] as number[]).map((m, i) => ({
      id: `visit-${i}`, month: m, color: "#453EDC", icon: "dot" as const,
    })) as TimelinePoint[],
  },
];

/* ──────────────────────────────────────────────
 * 상세 팝오버
 * ────────────────────────────────────────────── */
function DetailPopover({ detail, position, onClose }: {
  detail: TimelineItemDetail; position: { x: number; y: number }; onClose: () => void;
}) {
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  // 위치 보정
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 360),
    top: Math.min(position.y + 8, window.innerHeight - 400),
    zIndex: 200,
  };

  return (
    <>
      <div ref={ref} className="w-[320px] rounded-[10px] border border-[#EAEBEC] bg-white shadow-xl" style={style}>
        {/* 헤더 */}
        <div className="flex items-center gap-[6px] px-[14px] pt-[12px] pb-[8px]">
          <span className="rounded-[4px] px-[6px] py-[2px] text-[10px] font-bold text-white" style={{ background: detail.categoryColor }}>
            {detail.category}
          </span>
          <span className="text-[12px] text-[#989BA2]">{detail.period}</span>
          <button onClick={onClose} className="ml-auto p-[2px] text-[#C2C4C8] hover:text-[#171719]">
            <X className="h-[14px] w-[14px]" />
          </button>
        </div>
        <div className="px-[14px] pb-[10px]">
          <h3 className="text-[14px] font-bold text-[#171719] leading-[1.4]">{detail.title}</h3>
        </div>

        <div className="border-t border-[#EAEBEC]" />

        {/* 필드 */}
        <div className="px-[14px] py-[10px] flex flex-col gap-[6px]">
          {detail.fields.map((f, i) => (
            <div key={i} className="flex items-start gap-[12px]">
              <span className="text-[11px] text-[#989BA2] w-[60px] shrink-0 pt-[1px]">{f.label}</span>
              <span className={`text-[12px] leading-[1.4] ${f.highlight ? "text-[#FF4242] font-bold" : "text-[#171719] font-medium"}`}>
                {f.value}
              </span>
            </div>
          ))}
        </div>

        {/* AI 노트 */}
        {detail.aiNote && (
          <div className="mx-[14px] mb-[10px] rounded-[6px] bg-[#FFFDE7] px-[10px] py-[8px] flex items-start gap-[6px]">
            <Lightbulb className="h-[13px] w-[13px] text-[#F5A623] shrink-0 mt-[1px]" />
            <span className="text-[11px] text-[#854F0B] leading-[1.5]">{detail.aiNote}</span>
          </div>
        )}

        {/* 이미지 섹션 */}
        {detail.images && detail.images.length > 0 && (
          <div className="border-t border-[#EAEBEC] px-[14px] py-[10px]">
            <div className="flex items-center justify-between mb-[8px]">
              <div className="flex items-center gap-[4px] text-[11px] text-[#70737C]">
                <ImageIcon className="h-[12px] w-[12px]" />
                촬영 이미지 ({detail.images.length})
              </div>
              <button
                className="flex items-center gap-[2px] text-[11px] text-[#453EDC] hover:underline"
                onClick={() => setImageViewerSrc(detail.images![0].src)}
              >
                <ExternalLink className="h-[10px] w-[10px]" />
                새 창에서 보기
              </button>
            </div>
            <div className="flex gap-[6px]">
              {detail.images.map((img, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center gap-[4px] group"
                  onClick={() => setImageViewerSrc(img.src)}
                >
                  <div className="w-[72px] h-[54px] rounded-[4px] bg-[#1A1A2E] flex items-center justify-center overflow-hidden border border-[#EAEBEC] group-hover:ring-2 group-hover:ring-[#453EDC]">
                    <span className="text-[20px]">🏥</span>
                  </div>
                  <span className="text-[9px] text-[#989BA2] max-w-[72px] truncate">{img.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 풀스크린 뷰어 */}
      {imageViewerSrc && (
        <ImageViewer
          images={detail.images || []}
          initialIndex={detail.images?.findIndex((img) => img.src === imageViewerSrc) || 0}
          onClose={() => setImageViewerSrc(null)}
        />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────
 * 이미지 뷰어 (풀스크린)
 * ────────────────────────────────────────────── */
function ImageViewer({ images, initialIndex, onClose }: {
  images: DetailImage[]; initialIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const img = images[idx];

  return (
    <div className="fixed inset-0 z-[300] bg-[#0D0D1A]/95 flex flex-col" onClick={onClose}>
      {/* 상단 바 */}
      <div className="flex items-center px-[16px] py-[10px] shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className="rounded-[4px] bg-[#453EDC] px-[6px] py-[2px] text-[10px] font-bold text-white mr-[8px]">검사 이미지</span>
        <span className="text-[13px] font-bold text-white">{img.title}</span>
        <span className="text-[12px] text-[#989BA2] ml-[8px]">김영숙 · 2024.12</span>
        <span className="ml-auto text-[12px] text-[#989BA2] mr-[12px]">{idx + 1} / {images.length}</span>
        <button className="p-[4px] text-[#989BA2] hover:text-white rounded-full hover:bg-white/10">
          <ZoomOut className="h-[16px] w-[16px]" />
        </button>
        <span className="text-[11px] text-[#989BA2] mx-[4px]">100%</span>
        <button className="p-[4px] text-[#989BA2] hover:text-white rounded-full hover:bg-white/10">
          <ZoomIn className="h-[16px] w-[16px]" />
        </button>
        <button className="p-[4px] text-[#989BA2] hover:text-white rounded-full hover:bg-white/10 ml-[4px]">
          <ExternalLink className="h-[16px] w-[16px]" />
        </button>
        <button onClick={onClose} className="p-[4px] text-[#989BA2] hover:text-white rounded-full hover:bg-white/10 ml-[4px]">
          <X className="h-[16px] w-[16px]" />
        </button>
      </div>

      {/* 이미지 영역 */}
      <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            className="absolute left-[16px] w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
          >
            <ChevronLeft className="h-[20px] w-[20px]" />
          </button>
        )}

        <div className="max-w-[70vw] max-h-[70vh] rounded-[8px] bg-[#1A1A2E] flex items-center justify-center p-[20px]">
          <span className="text-[80px]">🏥</span>
        </div>

        {images.length > 1 && (
          <button
            className="absolute right-[16px] w-[40px] h-[40px] rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
          >
            <ChevronRight className="h-[20px] w-[20px]" />
          </button>
        )}
      </div>

      {/* 하단 썸네일 */}
      <div className="flex items-center px-[16px] py-[10px] shrink-0 gap-[8px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-[6px]">
          {images.map((im, i) => (
            <button
              key={i}
              className={`w-[56px] h-[42px] rounded-[4px] bg-[#1A1A2E] flex items-center justify-center border-2 ${i === idx ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}
              onClick={() => setIdx(i)}
            >
              <span className="text-[16px]">🏥</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col ml-[8px]">
          <span className="text-[12px] text-white font-bold">{img.title}</span>
          <span className="text-[10px] text-[#989BA2]">{idx + 1} / {images.length} 장</span>
        </div>
        <div className="ml-auto flex gap-[6px]">
          <button className="flex items-center gap-[4px] rounded-[6px] border border-[#555] px-[10px] py-[5px] text-[11px] text-[#989BA2] hover:text-white hover:border-[#999]">
            초기화
          </button>
          <button className="flex items-center gap-[4px] rounded-[6px] border border-[#555] px-[10px] py-[5px] text-[11px] text-[#989BA2] hover:text-white hover:border-[#999]">
            다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 유틸
 * ────────────────────────────────────────────── */
function getMonthLabels() {
  const labels: { year: number; month: number; label: string }[] = [];
  for (let i = 0; i < TOTAL_MONTHS; i++) {
    const m = ((START_MONTH - 1 + i) % 12) + 1;
    const y = START_YEAR + Math.floor((START_MONTH - 1 + i) / 12);
    labels.push({ year: y, month: m, label: `${m}월` });
  }
  return labels;
}

function getYearGroups(labels: { year: number }[]) {
  const groups: { year: number; startIdx: number; count: number }[] = [];
  let cur = -1, s = 0, c = 0;
  labels.forEach((l, i) => {
    if (l.year !== cur) { if (cur !== -1) groups.push({ year: cur, startIdx: s, count: c }); cur = l.year; s = i; c = 1; } else c++;
  });
  if (cur !== -1) groups.push({ year: cur, startIdx: s, count: c });
  return groups;
}

/* ──────────────────────────────────────────────
 * 리사이즈 가능한 래퍼
 * ────────────────────────────────────────────── */
function useResize(initialW: number, initialH: number, minW: number, minH: number) {
  const [size, setSize] = useState({ w: initialW, h: initialH });
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setSize({
        w: Math.max(minW, startPos.current.w + (ev.clientX - startPos.current.x)),
        h: Math.max(minH, startPos.current.h + (ev.clientY - startPos.current.y)),
      });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size, minW, minH]);

  return { size, onMouseDown };
}

/* ──────────────────────────────────────────────
 * 메인 컴포넌트
 * ────────────────────────────────────────────── */
export default function ConsultationTimeline({ onClose }: { onClose: () => void }) {
  const ZOOM_OPTIONS = [32, 42, 54, 66, 82, 100, 120];
  const [zoomLevel, setZoomLevel] = useState(3);
  const monthWidth = ZOOM_OPTIONS[zoomLevel];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDetail, setActiveDetail] = useState<{ detail: TimelineItemDetail; pos: { x: number; y: number } } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [filterSelectedCat, setFilterSelectedCat] = useState<string | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleItem = (itemId: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  };

  const visibleData = DATA.filter((row) => !hiddenCategories.has(row.category)).map((row) => ({
    ...row,
    items: row.items.filter((item) => !hiddenItems.has((item as TimelineBar).id || (item as TimelinePoint).id)),
  }));

  const { size, onMouseDown: onResizeDown } = useResize(
    Math.min(window.innerWidth * 0.88, 1400),
    Math.min(window.innerHeight * 0.78, 680),
    600, 300
  );

  const labels = getMonthLabels();
  const yearGroups = getYearGroups(labels);
  const totalWidth = TOTAL_MONTHS * monthWidth;
  const BAR_H = 20;
  const BAR_GAP = 2;

  /* 현재 월 인덱스 (오늘 기준 클리핑용) */
  const nowDate = new Date();
  const nowMonthIdx = (nowDate.getFullYear() - START_YEAR) * 12 + (nowDate.getMonth() + 1 - START_MONTH);

  /** 바의 duration을 현재 월까지만 클리핑 */
  const clipDuration = (startMonth: number, durationMonths: number) => {
    const endMonth = startMonth + durationMonths;
    if (endMonth <= nowMonthIdx + 1) return durationMonths; // 이미 과거에 끝남
    return Math.max(1, nowMonthIdx + 1 - startMonth); // 현재 월까지만
  };

  /** 포인트가 현재 이후인지 확인 */
  const isPointFuture = (month: number) => month > nowMonthIdx;
  const BAR_PAD = 6;
  const HDR_H = 50;
  const CAT_W = 46;

  /* 바 행: 같은 약물명은 같은 레인에 배치 (분절 투약 지원) */
  const getBarLanes = (bars: TimelineBar[]) => {
    const lanes: Map<string, number> = new Map();
    let nextLane = 0;
    bars.forEach((bar) => {
      // 약물명에서 용량 제거하여 기본 이름 추출 (예: "아토르바스타틴 20mg" → "아토르바스타틴")
      const baseName = bar.label.replace(/\s*\d+.*$/, "");
      if (!lanes.has(baseName)) {
        lanes.set(baseName, nextLane++);
      }
    });
    return { lanes, totalLanes: nextLane };
  };

  const getRowHeight = (row: TimelineRow) => {
    if (row.type === "point") return 34;
    const bars = row.items as TimelineBar[];
    const { totalLanes } = getBarLanes(bars);
    return BAR_PAD * 2 + totalLanes * (BAR_H + BAR_GAP) - BAR_GAP;
  };

  const scrollToNow = () => {
    if (!scrollRef.current) return;
    const now = new Date();
    const idx = (now.getFullYear() - START_YEAR) * 12 + (now.getMonth() + 1 - START_MONTH);
    scrollRef.current.scrollLeft = Math.max(0, idx * monthWidth - 200);
  };

  useEffect(() => { const t = setTimeout(scrollToNow, 100); return () => clearTimeout(t); }, [monthWidth]);

  const handleItemClick = (e: React.MouseEvent, detail?: TimelineItemDetail) => {
    if (!detail) return;
    setActiveDetail({ detail, pos: { x: e.clientX, y: e.clientY } });
  };

  const endY = START_YEAR + Math.floor((START_MONTH - 1 + TOTAL_MONTHS - 1) / 12);
  const endM = ((START_MONTH - 1 + TOTAL_MONTHS - 1) % 12) + 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="rounded-[6px] border border-[#C2C4C8] bg-white shadow-2xl flex flex-col overflow-hidden relative"
        style={{ width: size.w, height: size.h }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 카드 모듈 스타일 */}
        <div className="flex h-[32px] items-center bg-[#E8ECF6] px-[12px] shrink-0">
          <span className="text-[13px] font-bold text-[#171719]">진료 타임라인</span>
          <span className="ml-[8px] text-[11px] text-[#989BA2]">
            {START_YEAR}.{String(START_MONTH).padStart(2, "0")} ~ {endY}.{String(endM).padStart(2, "0")} ({Math.floor(TOTAL_MONTHS / 12)}년)
          </span>
          <div className="flex items-center gap-[4px] ml-auto relative">
            <IconBtn title="필터" onClick={() => setFilterOpen(!filterOpen)}><Filter className="h-[14px] w-[14px]" /></IconBtn>
            <IconBtn title="이전" onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft -= 200; }}><ChevronLeft className="h-[14px] w-[14px]" /></IconBtn>
            <button className="flex items-center gap-[2px] px-[5px] py-[1px] rounded-[4px] text-[10px] text-[#70737C] hover:bg-white/60 border border-[#C2C4C8] bg-white/40" onClick={scrollToNow}>
              <Calendar className="h-[10px] w-[10px]" /> 현재
            </button>
            <IconBtn title="다음" onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft += 200; }}><ChevronRight className="h-[14px] w-[14px]" /></IconBtn>
            <Sep />
            <IconBtn title="확대" onClick={() => setZoomLevel((z) => Math.min(z + 1, ZOOM_OPTIONS.length - 1))}><ZoomIn className="h-[14px] w-[14px]" /></IconBtn>
            <IconBtn title="축소" onClick={() => setZoomLevel((z) => Math.max(z - 1, 0))}><ZoomOut className="h-[14px] w-[14px]" /></IconBtn>
            <Sep />
            <IconBtn title="분리"><Columns className="h-[14px] w-[14px]" /></IconBtn>
            <Sep />
            <IconBtn title="닫기" onClick={onClose}><X className="h-[14px] w-[14px]" /></IconBtn>
          </div>
        </div>

        {/* 필터 팝업 */}
        {filterOpen && (
          <FilterPopup
            categories={DATA}
            hiddenCategories={hiddenCategories}
            hiddenItems={hiddenItems}
            selectedCat={filterSelectedCat}
            onSelectCat={setFilterSelectedCat}
            onToggleCategory={toggleCategory}
            onToggleItem={toggleItem}
            onClose={() => setFilterOpen(false)}
            onSelectAll={() => { setHiddenCategories(new Set()); setHiddenItems(new Set()); }}
          />
        )}

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 카테고리 열 */}
          <div className="shrink-0 border-r border-[#EAEBEC] bg-white z-10" style={{ width: CAT_W }}>
            <div style={{ height: HDR_H }} className="border-b border-[#EAEBEC]" />
            {visibleData.map((row) => (
              <div key={row.category} className="flex items-center justify-center border-b border-[#F0F0F2] text-[11px] font-bold text-[#46474C]"
                style={{ height: getRowHeight(row) }}>
                {row.category}
              </div>
            ))}
          </div>

          {/* 스크롤 영역 */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden" ref={scrollRef}>
            {(() => {
              const now = new Date();
              const nowMonthIdx = (now.getFullYear() - START_YEAR) * 12 + (now.getMonth() + 1 - START_MONTH);
              const nowX = nowMonthIdx * monthWidth + monthWidth / 2;
              const isInRange = nowMonthIdx >= 0 && nowMonthIdx < TOTAL_MONTHS;

              return (
            <div style={{ width: totalWidth, position: "relative" }}>
              {/* 년/월 헤더 */}
              <div style={{ height: HDR_H }} className="border-b border-[#EAEBEC] bg-white sticky top-0 z-[5] relative">
                <div className="flex" style={{ height: 24 }}>
                  {yearGroups.map((g) => (
                    <div key={g.year} className="flex items-center justify-center text-[12px] font-bold text-[#171719] border-b border-[#EAEBEC] border-r border-r-[#EAEBEC]"
                      style={{ width: g.count * monthWidth }}>{g.year}년</div>
                  ))}
                </div>
                <div className="flex relative" style={{ height: 26 }}>
                  {labels.map((l, i) => {
                    const isCurrent = isInRange && i === nowMonthIdx;
                    return (
                      <div key={i}
                        className={`flex items-center justify-center text-[10px] border-r border-[#F0F0F2] relative ${isCurrent ? "text-[#453EDC] font-bold bg-[#F1EDFF]" : "text-[#989BA2]"}`}
                        style={{ width: monthWidth }}
                      >
                        {l.label}
                      </div>
                    );
                  })}
                </div>
                {/* 현재 배지 (헤더 위) */}
                {isInRange && (
                  <div className="absolute z-[6]" style={{ left: nowX - 16, top: 2 }}>
                    <div className="rounded-[8px] bg-[#453EDC] px-[6px] py-[1px] text-[8px] font-bold text-white whitespace-nowrap shadow-sm">
                      현재
                    </div>
                  </div>
                )}
              </div>

              {/* 현재 세로 라인 (전체 데이터 영역 관통) */}
              {isInRange && (
                <div className="absolute z-[4] pointer-events-none" style={{ left: nowX, top: HDR_H, bottom: 0, width: 0 }}>
                  <div className="w-[2px] h-full bg-[#453EDC] opacity-40 -ml-[1px]" />
                </div>
              )}

              {/* 행 렌더링 */}
              {visibleData.map((row) => {
                const rowH = getRowHeight(row);

                return (
                  <div key={row.category} className="relative border-b border-[#F0F0F2]" style={{ height: rowH }}>
                    {/* 월 구분선 */}
                    {labels.map((_, i) => <div key={i} className="absolute top-0 bottom-0 border-r border-[#F4F4F5]" style={{ left: i * monthWidth }} />)}

                    {/* 바 렌더링 — 같은 약물명은 같은 레인 */}
                    {row.type === "bar" && (() => {
                      const bars = row.items as TimelineBar[];
                      const { lanes } = getBarLanes(bars);
                      return bars.map((bar) => {
                        if (bar.startMonth > nowMonthIdx) return null; // 미래 시작 바 숨김
                        const baseName = bar.label.replace(/\s*\d+.*$/, "");
                        const lane = lanes.get(baseName) ?? 0;
                        const top = BAR_PAD + lane * (BAR_H + BAR_GAP);
                        const left = bar.startMonth * monthWidth;
                        const clipped = clipDuration(bar.startMonth, bar.durationMonths);
                        const width = Math.max(clipped * monthWidth, monthWidth * 0.8);
                        return (
                          <div key={bar.id}
                            className="absolute flex items-center rounded-[3px] px-[5px] overflow-hidden cursor-pointer hover:brightness-110 hover:shadow-sm transition-all"
                            style={{ left, width, top, height: BAR_H, background: bar.color, opacity: 0.85 }}
                            onClick={(e) => handleItemClick(e, bar.detail)}
                          >
                            <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">{bar.label}</span>
                          </div>
                        );
                      });
                    })()}

                    {/* 포인트 렌더링 */}
                    {row.type === "point" && (row.items as TimelinePoint[]).map((pt) => {
                      if (isPointFuture(pt.month)) return null; // 미래 포인트 숨김
                      const cx = pt.month * monthWidth + monthWidth / 2;
                      const cy = rowH / 2;

                      if (pt.icon === "dot") return (
                        <div key={pt.id} className="absolute rounded-full cursor-pointer hover:scale-150 transition-transform"
                          style={{ left: cx - 4, top: cy - 4, width: 8, height: 8, background: pt.color }}
                          onClick={(e) => handleItemClick(e, pt.detail)} />
                      );
                      if (pt.icon === "circle") return (
                        <div key={pt.id} className="absolute flex items-center justify-center rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                          style={{ left: cx - 9, top: cy - 9, width: 18, height: 18, borderColor: pt.color, background: "white" }}
                          onClick={(e) => handleItemClick(e, pt.detail)}>
                          <span className="text-[8px] font-bold" style={{ color: pt.color }}>⊕</span>
                        </div>
                      );

                      // badge — 최소 너비 보장
                      const badgeW = pt.label ? Math.max(pt.label.length * 9 + 18, 36) : 24;
                      return (
                        <div key={pt.id} className="absolute flex items-center justify-center rounded-[10px] px-[5px] cursor-pointer hover:brightness-110 transition-all"
                          style={{ left: cx - badgeW / 2, top: cy - 10, height: 20, minWidth: badgeW, background: pt.color, whiteSpace: "nowrap" }}
                          onClick={(e) => handleItemClick(e, pt.detail)}>
                          <span className="text-[8px] font-bold text-white mr-[2px]">⊕</span>
                          {pt.label && <span className="text-[9px] font-bold text-white">{pt.label}</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
              );
            })()}
          </div>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-between px-[14px] py-[5px] border-t border-[#EAEBEC] shrink-0">
          <div className="flex items-center gap-[10px]">
            <Legend color="#7C5CFA" label="진단" /><Legend color="#F57010" label="상병" /><Legend color="#2EA652" label="투약" /><Legend color="#45B5AA" label="접종" /><Legend color="#453EDC" label="내원" />
          </div>
          <span className="text-[10px] text-[#C2C4C8]">항목 클릭 시 상세 확인</span>
        </div>

        {/* 리사이즈 핸들 */}
        <div className="absolute right-0 bottom-0 w-[16px] h-[16px] cursor-se-resize" onMouseDown={onResizeDown}>
          <svg width="16" height="16" viewBox="0 0 16 16" className="text-[#C2C4C8]">
            <path d="M14 16L16 14M10 16L16 10M6 16L16 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>

      {/* 상세 팝오버 */}
      {activeDetail && (
        <DetailPopover detail={activeDetail.detail} position={activeDetail.pos} onClose={() => setActiveDetail(null)} />
      )}
    </div>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return <button className="p-[3px] text-[#70737C] hover:text-[#171719] hover:bg-white/40 rounded-[3px]" title={title} onClick={onClick}>{children}</button>;
}
function Sep() { return <div className="w-px h-[14px] bg-[#C2C4C8] mx-[1px]" />; }
function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-[3px] text-[10px] text-[#70737C]"><span className="h-[7px] w-[7px] rounded-[2px]" style={{ background: color }} />{label}</span>;
}

/* ──────────────────────────────────────────────
 * 카테고리 도트 색상
 * ────────────────────────────────────────────── */
const CAT_DOT_COLOR: Record<string, string> = {
  진단: "#453EDC", 상병: "#F57010", 투약: "#378ADD", 검사: "#2EA652", 접종: "#9B8AFB", 내원: "#453EDC",
};
const CAT_DESC: Record<string, string> = {
  진단: "주요 진단명", 상병: "급성/만성 질환", 투약: "처방 약물", 검사: "검사/검진 이력", 접종: "예방접종 기록", 내원: "외래 방문 이력",
};

/* ──────────────────────────────────────────────
 * 항목 필터 팝업
 * ────────────────────────────────────────────── */
function FilterPopup({
  categories, hiddenCategories, hiddenItems, selectedCat,
  onSelectCat, onToggleCategory, onToggleItem, onClose, onSelectAll,
}: {
  categories: TimelineRow[];
  hiddenCategories: Set<string>;
  hiddenItems: Set<string>;
  selectedCat: string | null;
  onSelectCat: (cat: string | null) => void;
  onToggleCategory: (cat: string) => void;
  onToggleItem: (id: string) => void;
  onClose: () => void;
  onSelectAll: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const allVisible = hiddenCategories.size === 0 && hiddenItems.size === 0;
  const selectedRow = selectedCat ? categories.find((r) => r.category === selectedCat) : null;

  // 선택된 카테고리의 아이템 목록 추출
  const selectedItems: { id: string; label: string }[] = [];
  if (selectedRow) {
    selectedRow.items.forEach((item) => {
      const bar = item as TimelineBar;
      const pt = item as TimelinePoint;
      const id = bar.id || pt.id;
      const label = bar.label || pt.label || `${selectedRow.category} ${pt.month ? `#${pt.month}` : ""}`;
      // 중복 제거 (같은 약물 분절 바)
      if (!selectedItems.find((si) => si.label === label)) {
        selectedItems.push({ id, label });
      }
    });
  }

  return (
    <div ref={ref} className="absolute right-[120px] top-[32px] z-[60] flex rounded-[8px] border border-[#EAEBEC] bg-white shadow-xl overflow-hidden" style={{ maxHeight: 340 }}>
      {/* 왼쪽: 카테고리 목록 */}
      <div className="w-[180px] border-r border-[#EAEBEC] flex flex-col">
        <div className="flex items-center justify-between px-[10px] py-[7px] border-b border-[#EAEBEC]">
          <div className="flex items-center gap-[4px]">
            <Filter className="h-[11px] w-[11px] text-[#453EDC]" />
            <span className="text-[11px] font-bold text-[#171719]">항목 필터</span>
          </div>
          <button
            className="text-[10px] text-[#453EDC] font-bold hover:underline"
            onClick={onSelectAll}
          >
            {allVisible ? "전체 선택됨" : "전체 선택"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-[2px]">
          {categories.map((row) => {
            const isVisible = !hiddenCategories.has(row.category);
            const isSelected = selectedCat === row.category;
            return (
              <div
                key={row.category}
                className={`flex items-center gap-[6px] px-[10px] py-[7px] cursor-pointer transition-colors ${isSelected ? "bg-[#F1EDFF] border-l-2 border-[#453EDC]" : "hover:bg-[#F8F8FA] border-l-2 border-transparent"}`}
                onClick={() => onSelectCat(isSelected ? null : row.category)}
              >
                {/* 드래그 핸들 */}
                <div className="flex flex-col gap-[1px] text-[#C2C4C8]">
                  <div className="flex gap-[1.5px]"><span className="w-[2px] h-[2px] rounded-full bg-current" /><span className="w-[2px] h-[2px] rounded-full bg-current" /></div>
                  <div className="flex gap-[1.5px]"><span className="w-[2px] h-[2px] rounded-full bg-current" /><span className="w-[2px] h-[2px] rounded-full bg-current" /></div>
                  <div className="flex gap-[1.5px]"><span className="w-[2px] h-[2px] rounded-full bg-current" /><span className="w-[2px] h-[2px] rounded-full bg-current" /></div>
                </div>
                {/* 체크박스 */}
                <button
                  className={`flex h-[16px] w-[16px] items-center justify-center rounded-[3px] shrink-0 transition-colors ${isVisible ? "bg-[#453EDC]" : "border-[1.5px] border-[#C2C4C8] bg-white"}`}
                  onClick={(e) => { e.stopPropagation(); onToggleCategory(row.category); }}
                >
                  {isVisible && <svg width="10" height="7" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                {/* 도트 */}
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: CAT_DOT_COLOR[row.category] || "#999" }} />
                {/* 라벨 */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-[#171719]">{row.category}</span>
                  <span className="text-[9px] text-[#989BA2]">{CAT_DESC[row.category]}</span>
                </div>
                <ChevronRight className="h-[12px] w-[12px] text-[#C2C4C8] shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 오른쪽: 선택된 카테고리 상세 */}
      {selectedCat && selectedItems.length > 0 && (
        <div className="w-[170px] flex flex-col">
          <div className="flex items-center gap-[4px] px-[10px] py-[7px] border-b border-[#EAEBEC]">
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: CAT_DOT_COLOR[selectedCat] || "#999" }} />
            <span className="text-[11px] font-bold text-[#171719]">{selectedCat} 상세</span>
            <span className="text-[9px] text-[#989BA2]">({selectedItems.length})</span>
            <div className="ml-auto flex items-center gap-[4px]">
              <button className="text-[9px] text-[#453EDC] hover:underline"
                onClick={() => { selectedItems.forEach((si) => { if (hiddenItems.has(si.id)) onToggleItem(si.id); }); }}>전체</button>
              <span className="text-[9px] text-[#EAEBEC]">|</span>
              <button className="text-[9px] text-[#989BA2] hover:underline"
                onClick={() => { selectedItems.forEach((si) => { if (!hiddenItems.has(si.id)) onToggleItem(si.id); }); }}>해제</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-[2px]">
            {selectedItems.map((si) => {
              const isVisible = !hiddenItems.has(si.id);
              return (
                <div key={si.id} className="flex items-center gap-[6px] px-[10px] py-[5px] hover:bg-[#F8F8FA] cursor-pointer"
                  onClick={() => onToggleItem(si.id)}>
                  <div className={`flex h-[16px] w-[16px] items-center justify-center rounded-[3px] shrink-0 transition-colors ${isVisible ? "bg-[#453EDC]" : "border-[1.5px] border-[#C2C4C8] bg-white"}`}>
                    {isVisible && <svg width="10" height="7" viewBox="0 0 12 9" fill="none"><path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="text-[11px] text-[#171719]">{si.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
