export interface PanelCounts {
  appointment: number;  // 예약 패널 개수
  treatment: number;    // 진료실 패널 개수
  payment: number;      // 수납 패널 개수
}

export interface DynamicPanelConfig {
  id: string;           // 고유 식별자 (key): "appointment-1", "treatment-1", "treatment-2" 등
  name: string;         // 표시용 title: "예약", "진료실", "수납"
  icon: string;
  type: 'appointment' | 'treatment' | 'payment';
  roomName?: string;    // 진료실/수납실 이름 (예: "진료실1", "수납1") - 필터링용
  dataSource: 'appointments' | 'registrations';
  filter?: (data: any[]) => any[];
  order: number;        // 패널 순서
  isActive: boolean;    // 활성화 여부
}

export interface PanelSettings {
  hospitalId: string;
  panelCounts: PanelCounts; // 패널 타입별 개수
  panels: DynamicPanelConfig[]; // 실제 생성된 패널들
}

// API 응답 타입
export interface PanelSettingsResponse {
  success: boolean;
  data: PanelSettings;
  message?: string;
} 