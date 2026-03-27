/**
 * Medical V2 위젯 레지스트리
 * 모든 카드 모듈을 위젯으로 정의하고, 도킹 레이아웃에서 사용
 */

export type WidgetCategory = "진료" | "참고" | "AI" | "운영" | "수납";

export interface WidgetDefinition {
  id: string;
  title: string;
  category: WidgetCategory;
  description: string;
  icon: string; // emoji for simplicity
  minWidth?: number;
  defaultSize?: number; // percentage in layout
}

/** 모든 사용 가능한 위젯 정의 */
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // ─── 진료 ───
  { id: "calendar-patients", title: "진료 일정", category: "진료", description: "캘린더 및 대기환자 목록", icon: "📅", minWidth: 200, defaultSize: 15 },
  { id: "patient-info", title: "환자 기본정보", category: "참고", description: "환자 이름, 나이, 성별, 보험정보", icon: "👤", minWidth: 320, defaultSize: 25 },
  { id: "diagnosis-prescription", title: "진단 및 처방", category: "진료", description: "상병 및 처방 전체 검색 입력", icon: "📋", minWidth: 400, defaultSize: 30 },
  { id: "bundle-prescription", title: "묶음처방", category: "진료", description: "묶음처방 트리 및 상세", icon: "📦", minWidth: 300, defaultSize: 18 },
  { id: "clinical-memo", title: "임상메모", category: "진료", description: "임상 메모를 입력하세요", icon: "📝", minWidth: 200 },
  { id: "patient-memo", title: "환자메모", category: "진료", description: "환자별도 메모(필요 시 작성)", icon: "💬", minWidth: 200 },
  { id: "symptom", title: "증상", category: "진료", description: "증상을 입력하세요", icon: "🩺", minWidth: 200 },

  // ─── 참고 ───
  { id: "consultation-timeline", title: "진료 타임라인", category: "참고", description: "AI 진료이력 요약 및 타임라인 차트", icon: "📊", minWidth: 280 },
  { id: "vitals", title: "바이탈 사인", category: "참고", description: "혈압, 체온, 맥박, 산소포화도", icon: "❤️", minWidth: 200 },
  { id: "referral", title: "의뢰회신", category: "진료", description: "타 병원/과 의뢰 및 회신 관리", icon: "📄", minWidth: 280 },
  { id: "image-viewer", title: "영상/이미지 뷰어", category: "진료", description: "X-ray, CT, 초음파 등 이미지 뷰어", icon: "🖼️", minWidth: 300 },
  { id: "lab-results", title: "검사 결과", category: "진료", description: "혈액검사, 소변검사 등 결과 확인", icon: "🔬", minWidth: 280 },

  // ─── AI ───
  { id: "ai-assistant", title: "AI 채팅 어시스턴트", category: "AI", description: "AI에 대화형 진료 보조", icon: "🤖", minWidth: 280 },

  // ─── 운영 ───
  { id: "schedule", title: "오늘 일정", category: "운영", description: "오늘 예약 환자 목록 및 일정", icon: "🗓️", minWidth: 200 },

  // ─── 수납 ───
  { id: "billing", title: "수납/청구", category: "수납", description: "급여비용 구분, 수납 현황", icon: "💰", minWidth: 200 },
  { id: "drug-interaction", title: "약물 상호작용", category: "참고", description: "처방 약물 간 상호작용 경고", icon: "⚠️", minWidth: 200 },
];

/** 위젯 ID로 정의 찾기 */
export function getWidgetById(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find((w) => w.id === id);
}

/** 카테고리별 위젯 그룹 */
export function getWidgetsByCategory(): Record<WidgetCategory, WidgetDefinition[]> {
  const grouped: Record<string, WidgetDefinition[]> = {};
  for (const w of WIDGET_DEFINITIONS) {
    if (!grouped[w.category]) grouped[w.category] = [];
    grouped[w.category].push(w);
  }
  return grouped as Record<WidgetCategory, WidgetDefinition[]>;
}

/** 기본 활성 위젯 ID 목록 (초기 레이아웃에 포함) */
export const DEFAULT_ACTIVE_WIDGET_IDS = [
  "calendar-patients",
  "patient-info",
  "diagnosis-prescription",
  "bundle-prescription",
  "clinical-memo",
  "patient-memo",
  "symptom",
];
