import { AppointmentStatus } from "./common/common-enum";

export const TITLE_ICON_MAP: Record<string, string> = {
  예약: "🗓️",
  진료실: "👩🏻‍⚕️",
  수납실: "💰",
};

export const TITLE_LABEL_MAP: Record<string, string> = {
  예약: "총 예약",
  진료실: "총 대기",
  수납실: "총 수납대기",
};

// 상태별 탭 정보 매핑
export const STATUS_TABS_MAP: Record<
  string,
  { key: string | AppointmentStatus; label: string }[]
> = {
  예약: [
    { key: "all", label: "전체" },
    { key: AppointmentStatus.PENDING, label: "대기" },
    { key: AppointmentStatus.CONFIRMED, label: "확정" },
    { key: AppointmentStatus.VISITED, label: "내원" },
    { key: AppointmentStatus.NOSHOW, label: "노쇼" },
    { key: AppointmentStatus.CANCELED, label: "취소" },
  ],
  진료실: [],
  수납실: [
    { key: "all", label: "전체" },
    { key: "대기", label: "대기" },
    { key: "완료", label: "완료" },
  ],
};

// 정렬 옵션
export const SORT_OPTIONS = [
  { key: "name-asc", label: "이름 오름차순" },
  { key: "name-desc", label: "이름 내림차순" },
  { key: "recent", label: "최근 등록순" },
  { key: "oldest", label: "오래된순" },
];

/**
 * 접수 패널 타입 단일 소스.
 * - 문자열 리터럴이 코드 전반에 흩어지는 것을 방지하기 위해 공용 constants로 관리합니다.
 * - 타입은 여기서 파생(derive)되어 리네이밍/확장 시 영향 범위를 최소화합니다.
 */
export const PANEL_TYPE = {
  APPOINTMENT: "appointment",
  TREATMENT: "treatment",
  PAYMENT: "payment",
  CHAT: "chat",
} as const;

export type PanelTypeKey = (typeof PANEL_TYPE)[keyof typeof PANEL_TYPE];

