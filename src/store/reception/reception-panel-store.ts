import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { PanelSettings, PanelCounts, DynamicPanelConfig } from '@/types/panel-config-types';

// ================================ Reception Panel Store State ================================
export interface ReceptionPanelState {
  // ================================ 상태 ================================
  panelSettings: PanelSettings | null;
  isLoading: boolean;
  error: string | null;

  // ================================ Getter ================================
  // 패널 설정 관련 getter
  getPanelSettings: () => PanelSettings | null;
  getPanelCounts: () => PanelCounts | null;
  getPanels: () => DynamicPanelConfig[];
  getActivePanels: () => DynamicPanelConfig[];
  getPanelById: (panelId: string) => DynamicPanelConfig | undefined;
  getPanelsByType: (type: 'appointment' | 'treatment' | 'payment') => DynamicPanelConfig[];
  getPanelsByRoomName: (roomName: string) => DynamicPanelConfig[];
  getNextPanelOrder: () => number;
  getHospitalId: () => string | null;

  // ================================ Setter ================================
  // 액션
  setPanelSettings: (settings: PanelSettings) => void;
  updatePanelCounts: (panelCounts: PanelCounts, hospitalId?: string) => void;
  updatePanel: (panelId: string, updates: Partial<DynamicPanelConfig>) => void;
  togglePanelActive: (panelId: string) => void;
  resetToDefault: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 기본 패널 설정 TODO : 현재는 DB가 없어서 임시 사용. filter 조건은 차후 Status등 으로 변경 필요. 현재는 roomPanel 기준
const createDefaultPanelSettings = (hospitalId: string): PanelSettings => {
  const defaultCounts: PanelCounts = {
    appointment: 1,
    treatment: 1,
    payment: 1
  };

  const panels: DynamicPanelConfig[] = [
    {
      id: "appointment-1",
      name: "예약",
      icon: "📅",
      type: "appointment",
      dataSource: "appointments",
      order: 1,
      isActive: true
    },
    {
      id: "treatment-1",
      name: "진료실",
      icon: "🏥",
      type: "treatment",
      roomName: "진료실",
      dataSource: "registrations",
      filter: (registrations: any[]) => registrations.filter(f => f.roomPanel === "진료실"),
      order: 2,
      isActive: true
    },
    {
      id: "payment-1",
      name: "수납",
      icon: "💰",
      type: "payment",
      roomName: "수납",
      dataSource: "registrations",
      filter: (registrations: any[]) => registrations.filter(f => f.roomPanel === "수납"),
      order: 3,
      isActive: true
    }
  ];

  return {
    hospitalId,
    panelCounts: defaultCounts,
    panels
  };
};

export const useReceptionPanelStore = create<ReceptionPanelState>()(
  devtools(
    (set, get) => ({
      // ================================ 초기 상태 ================================
      panelSettings: null,
      isLoading: false,
      error: null,

      // ================================ Getter ================================
      // 패널 설정 관련 getter
      getPanelSettings: () => {
        const { panelSettings } = get();
        return panelSettings;
      },

      getPanelCounts: () => {
        const { panelSettings } = get();
        return panelSettings?.panelCounts || null;
      },

      getPanels: () => {
        const { panelSettings } = get();
        return panelSettings?.panels || [];
      },

      getActivePanels: () => {
        const { panelSettings } = get();
        return panelSettings?.panels.filter(panel => panel.isActive) || [];
      },

      getPanelById: (panelId: string) => {
        const { panelSettings } = get();
        return panelSettings?.panels.find(panel => panel.id === panelId);
      },

      getPanelsByType: (type: 'appointment' | 'treatment' | 'payment') => {
        const { panelSettings } = get();
        return panelSettings?.panels.filter(panel => panel.type === type) || [];
      },

      getPanelsByRoomName: (roomName: string) => {
        const { panelSettings } = get();
        return panelSettings?.panels.filter(panel => panel.roomName === roomName) || [];
      },

      getNextPanelOrder: () => {
        const { panelSettings } = get();
        if (!panelSettings?.panels.length) return 1;
        return Math.max(...panelSettings.panels.map(panel => panel.order)) + 1;
      },

      getHospitalId: () => {
        const { panelSettings } = get();
        return panelSettings?.hospitalId || null;
      },

      // ================================ Setter ================================
      // 패널 설정 설정
      setPanelSettings: (settings: PanelSettings) => {
        set({
          panelSettings: settings,
          error: null
        });
      },

      // 패널 개수 업데이트 (환경설정에서 호출)
      updatePanelCounts: (panelCounts: PanelCounts, hospitalId?: string) => {
        const { panelSettings } = get();

        // panelSettings가 없으면 기본 설정으로 초기화
        if (!panelSettings) {
          const defaultSettings = createDefaultPanelSettings(hospitalId || "temp-hospital-id");
          set({ panelSettings: defaultSettings });
        }

        const currentSettings = get().panelSettings;
        if (!currentSettings) return;

        const panels: DynamicPanelConfig[] = [];
        let order = 1;

        // 예약 패널 생성
        for (let i = 1; i <= panelCounts.appointment; i++) {
          panels.push({
            id: `appointment-${i}`,
            name: "예약",
            icon: "📅",
            type: "appointment",
            dataSource: "appointments",
            order: order++,
            isActive: true
          });
        }

        // 진료실 패널 생성
        for (let i = 1; i <= panelCounts.treatment; i++) {
          const roomName = `진료실${i}`;
          panels.push({
            id: `treatment-${i}`,
            name: "진료실", // 모든 진료실 패널은 같은 title 사용
            icon: "🏥",
            type: "treatment",
            roomName: roomName,
            dataSource: "registrations",
            filter: (registrations: any[]) => registrations.filter(f => f.roomPanel === roomName),
            order: order++,
            isActive: true
          });
        }

        // 수납 패널 생성
        for (let i = 1; i <= panelCounts.payment; i++) {
          const roomName = `수납`;
          panels.push({
            id: `payment-${i}`,
            name: "수납", // 모든 수납 패널은 같은 title 사용
            icon: "💰",
            type: "payment",
            roomName: roomName,
            dataSource: "registrations",
            filter: (registrations: any[]) => registrations.filter(f => f.roomPanel === roomName),
            order: order++,
            isActive: true
          });
        }

        set({
          panelSettings: {
            ...currentSettings,
            panelCounts,
            panels
          },
          error: null
        });
      },

      updatePanel: (panelId: string, updates: Partial<DynamicPanelConfig>) => {
        const { panelSettings } = get();
        if (!panelSettings) return;

        set({
          panelSettings: {
            ...panelSettings,
            panels: panelSettings.panels.map(panel =>
              panel.id === panelId ? { ...panel, ...updates } : panel
            )
          }
        });
      },

      // 패널 활성화/비활성화 토글
      togglePanelActive: (panelId: string) => {
        const { panelSettings } = get();
        if (!panelSettings) return;

        set({
          panelSettings: {
            ...panelSettings,
            panels: panelSettings.panels.map(panel =>
              panel.id === panelId ? { ...panel, isActive: !panel.isActive } : panel
            )
          }
        });
      },

      // 기본값으로 리셋
      resetToDefault: () => {
        const { panelSettings } = get();
        if (!panelSettings) return;

        const defaultSettings = createDefaultPanelSettings(panelSettings.hospitalId);
        set({
          panelSettings: defaultSettings,
          error: null
        });
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 에러 설정
      setError: (error: string) => {
        set({ error, isLoading: false });
      },

      // 에러 클리어
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'reception-panel-store',
    }
  )
); 