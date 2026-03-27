// 설정 범위
export type SettingsScope = "system" | "user";

// 설정 응답 타입
export interface SettingsTypes {
  id: number;
  scope: SettingsScope;
  category: string;
  userId: number;
  hospitalId: number;
  pageContext: string;
  settings: Record<string, any>;
}

// 목록 조회 파라미터
export interface SettingsListParams {
  scope?: SettingsScope;
  category?: string;
  pageContext?: string;
}

// 생성/수정 요청 아이템
export interface SettingsItem {
  scope?: SettingsScope;
  category: string;
  pageContext?: string;
  settings: Record<string, any>;
}

// 생성/수정 요청 바디
export interface CreateOrUpdateSettingsRequest {
  items: SettingsItem[];
}

// 실시간 업데이트 파라미터 (category 필수)
export interface LiveUpdateSettingsParams {
  scope?: SettingsScope;
  category: string;
  pageContext?: string;
}

// 삭제 파라미터 (category, key 필수)
export interface DeleteSettingsParams {
  scope?: SettingsScope;
  category: string;
  pageContext?: string;
  key?: string;
}
