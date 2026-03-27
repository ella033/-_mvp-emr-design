"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronRight, X, ZoomIn, ZoomOut, Maximize2, ExternalLink } from "lucide-react";
import CardModule from "./layout/card-module";
import CardHeader from "./layout/card-header";
import CardMoreMenu from "./layout/card-more-menu";

/* ── 검사 유형 ── */
const IMAGE_TYPES = [
  { id: "all", label: "전체", color: "#46474C" },
  { id: "xray", label: "X-ray", color: "#0066FF" },
  { id: "ct", label: "CT", color: "#7C5CFA" },
  { id: "mri", label: "MRI", color: "#2EA652" },
  { id: "ultrasound", label: "초음파", color: "#F57010" },
  { id: "endoscopy", label: "내시경", color: "#C266FF" },
  { id: "ecg", label: "ECG", color: "#FF4242" },
  { id: "pathology", label: "병리", color: "#989BA2" },
] as const;

type ImageType = (typeof IMAGE_TYPES)[number]["id"];

/* ── 검사 유형별 실제 이미지 경로 ── */
function getMedicalImage(type: ImageType): string {
  switch (type) {
    case "xray": return "/images/medical/chest-xray.jpg";
    case "ct": return "/images/medical/ct-scan.jpg";
    case "mri": return "/images/medical/brain-mri.jpg";
    case "ultrasound": return "/images/medical/ultrasound.jpg";
    // 내시경/ECG/병리는 SVG 폴백
    case "endoscopy":
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#000" width="400" height="400"/><circle cx="200" cy="200" r="170" fill="#8B2020"/><radialGradient id="g"><stop offset="0%" stop-color="#DD6644"/><stop offset="100%" stop-color="#882020"/></radialGradient><circle cx="200" cy="200" r="160" fill="url(#g)"/><circle cx="200" cy="200" r="40" fill="#330808" opacity="0.8"/><path d="M180 160 Q200 140 220 160" fill="none" stroke="#FFaa88" stroke-width="2" opacity="0.6"/></svg>`)}`;
    case "ecg":
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#0a1a0a" width="400" height="300"/><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a3a1a" stroke-width="0.5"/></pattern></defs><rect fill="url(#grid)" width="400" height="300"/><polyline points="0,150 50,150 60,140 65,150 80,150 90,120 95,200 100,80 105,180 110,150 150,150 180,140 185,150 200,150 210,120 215,200 220,80 225,180 230,150 270,150 300,140 305,150 320,150 330,120 335,200 340,80 345,180 350,150 400,150" fill="none" stroke="#00FF44" stroke-width="2"/><text x="10" y="20" font-size="11" fill="#00AA33">II</text></svg>`)}`;
    default:
      return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#1a1a2a" width="400" height="400"/><text x="200" y="200" text-anchor="middle" fill="#555" font-size="14">의료 이미지</text></svg>`)}`;
  }
}

/* ── 더미 이미지 데이터 (히스토리) ── */
const IMAGE_HISTORY = [
  {
    id: "img-001", date: "2026-03-15", type: "xray" as ImageType, title: "흉부 X-ray (정면)",
    doctor: "이정민", department: "내과",
    description: "폐야 깨끗, 심비대 소견 없음", status: "정상",
  },
  {
    id: "img-002", date: "2026-03-15", type: "ecg" as ImageType, title: "ECG 심전도",
    doctor: "이정민", department: "내과",
    description: "동율동, ST 변화 없음", status: "정상",
  },
  {
    id: "img-003", date: "2026-01-20", type: "ct" as ImageType, title: "복부 CT (조영)",
    doctor: "김영수", department: "외과",
    description: "간, 담낭, 췌장 이상소견 없음. 좌측 신낭종 12mm", status: "관찰",
  },
  {
    id: "img-004", date: "2026-01-20", type: "xray" as ImageType, title: "흉부 X-ray (정면)",
    doctor: "김영수", department: "외과",
    description: "수술 전 검사, 특이소견 없음", status: "정상",
  },
  {
    id: "img-005", date: "2025-11-05", type: "ultrasound" as ImageType, title: "경부 초음파",
    doctor: "이정민", department: "내과",
    description: "갑상선 우엽 결절 8mm, 양성 의심", status: "관찰",
  },
  {
    id: "img-006", date: "2025-11-05", type: "xray" as ImageType, title: "경추 X-ray (측면)",
    doctor: "박준호", department: "정형외과",
    description: "경추 전만 감소, C5-6 간격 좁아짐", status: "이상",
  },
  {
    id: "img-007", date: "2025-08-12", type: "endoscopy" as ImageType, title: "위내시경",
    doctor: "이정민", department: "내과",
    description: "만성 표재성 위염, H.pylori 음성", status: "관찰",
  },
  {
    id: "img-008", date: "2025-08-12", type: "ultrasound" as ImageType, title: "복부 초음파",
    doctor: "이정민", department: "내과",
    description: "경도 지방간, 담석 없음", status: "관찰",
  },
  {
    id: "img-009", date: "2025-05-20", type: "mri" as ImageType, title: "뇌 MRI",
    doctor: "최민수", department: "신경과",
    description: "뇌실질 이상소견 없음", status: "정상",
  },
  {
    id: "img-010", date: "2025-05-20", type: "ecg" as ImageType, title: "ECG 심전도",
    doctor: "이정민", department: "내과",
    description: "동율동, 정상 심전도", status: "정상",
  },
  {
    id: "img-011", date: "2025-02-10", type: "xray" as ImageType, title: "흉부 X-ray (정면)",
    doctor: "이정민", department: "내과",
    description: "정기 검진, 특이소견 없음", status: "정상",
  },
  {
    id: "img-012", date: "2024-12-18", type: "ct" as ImageType, title: "흉부 CT (비조영)",
    doctor: "이정민", department: "내과",
    description: "폐결절 없음, 종격동 정상", status: "정상",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "정상": return "text-[#2EA652] bg-[#EDF8EF]";
    case "관찰": return "text-[#F57010] bg-[#FFF3E8]";
    case "이상": return "text-[#FF4242] bg-[#FEECEC]";
    default: return "text-[#989BA2] bg-[#F4F4F5]";
  }
}

function getTypeInfo(type: ImageType) {
  return IMAGE_TYPES.find((t) => t.id === type) || IMAGE_TYPES[0];
}

/* ── 이미지 뷰어 전체화면 ── */
function ImageFullView({ image, onClose }: { image: typeof IMAGE_HISTORY[0]; onClose: () => void }) {
  const [zoom, setZoom] = useState(100);
  const typeInfo = getTypeInfo(image.type);

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a2e] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-[16px] py-[10px] bg-[#0d0d1a] text-white">
        <div className="flex items-center gap-[10px]">
          <span className="rounded-[4px] px-[6px] py-[2px] text-[11px] font-bold" style={{ backgroundColor: typeInfo.color + "30", color: typeInfo.color }}>
            {typeInfo.label}
          </span>
          <span className="text-[14px] font-bold">{image.title}</span>
          <span className="text-[12px] text-[#989BA2]">{image.doctor} · {image.date}</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-[4px] text-[#989BA2] hover:text-white"><ZoomOut className="h-[16px] w-[16px]" /></button>
          <span className="text-[12px] text-[#989BA2] w-[40px] text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))} className="p-[4px] text-[#989BA2] hover:text-white"><ZoomIn className="h-[16px] w-[16px]" /></button>
          <button onClick={() => setZoom(100)} className="p-[4px] text-[12px] text-[#989BA2] hover:text-white">초기화</button>
          <div className="w-px h-[16px] bg-[#46474C] mx-[4px]" />
          <button onClick={onClose} className="p-[4px] text-[#989BA2] hover:text-white"><X className="h-[18px] w-[18px]" /></button>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-[20px]">
        <div
          className="rounded-[8px] overflow-hidden border border-[#46474C] bg-[#0a0a12]"
          style={{ width: `${4 * zoom}px`, height: `${3.5 * zoom}px`, transition: "width 0.2s, height 0.2s" }}
        >
          <img src={getMedicalImage(image.type)} alt={image.title} className="w-full h-full object-contain" />
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between px-[16px] py-[8px] bg-[#0d0d1a] text-[12px] text-[#989BA2]">
        <span>{image.description}</span>
        <span className={`rounded-[4px] px-[6px] py-[2px] text-[11px] font-bold ${getStatusColor(image.status)}`}>{image.status}</span>
      </div>
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export default function ImageViewerPanel() {
  const [selectedType, setSelectedType] = useState<ImageType>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<typeof IMAGE_HISTORY[0] | null>(null);
  const [fullViewImage, setFullViewImage] = useState<typeof IMAGE_HISTORY[0] | null>(null);

  /* 필터링 */
  const filtered = useMemo(() => {
    return IMAGE_HISTORY.filter((img) => {
      if (selectedType !== "all" && img.type !== selectedType) return false;
      if (searchTerm && !img.title.toLowerCase().includes(searchTerm.toLowerCase()) && !img.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [selectedType, searchTerm]);

  /* 날짜별 그룹 */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof IMAGE_HISTORY>();
    for (const img of filtered) {
      const existing = map.get(img.date) || [];
      existing.push(img);
      map.set(img.date, existing);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  /* 처음 3개 날짜는 기본 펼침 */
  const isExpanded = (date: string, idx: number) => expandedDates.has(date) || idx < 3;

  return (
    <CardModule widgetId="image-viewer" className="w-full h-full min-w-0 bg-white">
      <CardHeader widgetId="image-viewer">
        <span className="text-[13px] font-bold text-[#171719]">영상/이미지 뷰어</span>
        <div className="flex items-center gap-[4px] ml-auto">
          <button
            className={`p-[2px] rounded-[4px] transition-colors ${filterOpen ? "text-[#453EDC] bg-[#F1EDFF]" : "text-[#70737C] hover:text-[#171719]"}`}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-[14px] w-[14px]" />
          </button>
          <CardMoreMenu widgetId="image-viewer" />
        </div>
      </CardHeader>

      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        {/* 필터 바 */}
        {filterOpen && (
          <div className="px-[10px] py-[8px] border-b border-[#EAEBEC] bg-[#FAFAFA] flex flex-col gap-[6px] shrink-0">
            {/* 검사 유형 필터 */}
            <div className="flex items-center gap-[4px] flex-wrap">
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`rounded-[12px] px-[8px] py-[3px] text-[11px] font-medium transition-colors ${
                    selectedType === t.id
                      ? "text-white"
                      : "text-[#70737C] bg-white border border-[#EAEBEC] hover:border-[#C2C4C8]"
                  }`}
                  style={selectedType === t.id ? { backgroundColor: t.color } : undefined}
                  onClick={() => setSelectedType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="flex items-center gap-[6px] px-[10px] py-[6px] border-b border-[#EAEBEC] shrink-0">
          <Search className="h-[13px] w-[13px] text-[#989BA2]" />
          <input
            type="text"
            placeholder="검사명, 소견 검색"
            className="flex-1 text-[12px] text-[#171719] placeholder-[#C2C4C8] outline-none bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-[#989BA2]"><X className="h-[12px] w-[12px]" /></button>
          )}
          <span className="text-[11px] text-[#989BA2]">{filtered.length}건</span>
        </div>

        {/* 히스토리 리스트 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[12px] text-[#989BA2]">검색 결과가 없습니다</div>
          ) : (
            grouped.map(([date, images], gIdx) => {
              const expanded = isExpanded(date, gIdx);
              return (
                <div key={date} className="border-b border-[#F0F0F2]">
                  {/* 날짜 헤더 */}
                  <button
                    className="flex w-full items-center gap-[6px] px-[10px] py-[6px] hover:bg-[#F8F8FA] transition-colors"
                    onClick={() => toggleDate(date)}
                  >
                    {expanded
                      ? <ChevronDown className="h-[12px] w-[12px] text-[#989BA2]" />
                      : <ChevronRight className="h-[12px] w-[12px] text-[#989BA2]" />}
                    <span className="text-[12px] font-bold text-[#171719]">{date}</span>
                    <span className="text-[11px] text-[#989BA2]">{images.length}건</span>
                  </button>

                  {/* 검사 항목 */}
                  {expanded && images.map((img) => {
                    const typeInfo = getTypeInfo(img.type);
                    const isSelected = selectedImage?.id === img.id;

                    return (
                      <div
                        key={img.id}
                        className={`flex items-start gap-[8px] px-[10px] py-[8px] ml-[18px] cursor-pointer transition-colors ${
                          isSelected ? "bg-[#F1EDFF]" : "hover:bg-[#F8F8FA]"
                        }`}
                        onClick={() => setSelectedImage(isSelected ? null : img)}
                      >
                        {/* 썸네일 */}
                        <div className="h-[40px] w-[40px] rounded-[4px] shrink-0 overflow-hidden bg-[#0a0a12]">
                          <img src={getMedicalImage(img.type)} alt={img.title} className="h-full w-full object-cover" />
                        </div>

                        <div className="flex flex-col flex-1 min-w-0 gap-[2px]">
                          <div className="flex items-center gap-[6px]">
                            <span className="text-[12px] font-bold text-[#171719] truncate">{img.title}</span>
                            <span className={`shrink-0 rounded-[4px] px-[4px] py-[1px] text-[10px] font-bold ${getStatusColor(img.status)}`}>
                              {img.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#70737C] truncate">{img.description}</span>
                          <span className="text-[10px] text-[#989BA2]">{img.doctor} · {img.department}</span>
                        </div>

                        {/* 전체화면 보기 */}
                        <button
                          className="shrink-0 p-[4px] text-[#989BA2] hover:text-[#453EDC]"
                          onClick={(e) => { e.stopPropagation(); setFullViewImage(img); }}
                          title="크게 보기"
                        >
                          <Maximize2 className="h-[12px] w-[12px]" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* 선택된 이미지 상세 (하단) */}
        {selectedImage && (
          <div className="border-t border-[#EAEBEC] bg-[#FAFAFA] p-[10px] shrink-0">
            <div className="flex items-center justify-between mb-[6px]">
              <div className="flex items-center gap-[6px]">
                <span className="rounded-[4px] px-[5px] py-[2px] text-[10px] font-bold" style={{ backgroundColor: getTypeInfo(selectedImage.type).color + "20", color: getTypeInfo(selectedImage.type).color }}>
                  {getTypeInfo(selectedImage.type).label}
                </span>
                <span className="text-[12px] font-bold text-[#171719]">{selectedImage.title}</span>
              </div>
              <div className="flex items-center gap-[4px]">
                <button
                  className="flex items-center gap-[3px] text-[11px] text-[#453EDC] hover:underline"
                  onClick={() => setFullViewImage(selectedImage)}
                >
                  <ExternalLink className="h-[11px] w-[11px]" />
                  새 창에서 보기
                </button>
                <button onClick={() => setSelectedImage(null)} className="p-[2px] text-[#989BA2]"><X className="h-[12px] w-[12px]" /></button>
              </div>
            </div>
            <div className="flex items-start gap-[10px]">
              {/* 미리보기 이미지 */}
              <div
                className="h-[80px] w-[100px] rounded-[4px] shrink-0 overflow-hidden cursor-pointer hover:opacity-80 bg-[#0a0a12]"
                onClick={() => setFullViewImage(selectedImage)}
              >
                <img src={getMedicalImage(selectedImage.type)} alt={selectedImage.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-[3px] text-[11px] min-w-0">
                <div className="flex gap-[16px]">
                  <span className="text-[#989BA2] shrink-0 w-[40px]">날짜</span>
                  <span className="text-[#171719]">{selectedImage.date}</span>
                </div>
                <div className="flex gap-[16px]">
                  <span className="text-[#989BA2] shrink-0 w-[40px]">담당</span>
                  <span className="text-[#171719]">{selectedImage.doctor} ({selectedImage.department})</span>
                </div>
                <div className="flex gap-[16px]">
                  <span className="text-[#989BA2] shrink-0 w-[40px]">소견</span>
                  <span className="text-[#171719]">{selectedImage.description}</span>
                </div>
                <div className="flex gap-[16px]">
                  <span className="text-[#989BA2] shrink-0 w-[40px]">판독</span>
                  <span className={`font-bold ${selectedImage.status === "정상" ? "text-[#2EA652]" : selectedImage.status === "이상" ? "text-[#FF4242]" : "text-[#F57010]"}`}>
                    {selectedImage.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 전체화면 이미지 뷰 */}
      {fullViewImage && <ImageFullView image={fullViewImage} onClose={() => setFullViewImage(null)} />}
    </CardModule>
  );
}
