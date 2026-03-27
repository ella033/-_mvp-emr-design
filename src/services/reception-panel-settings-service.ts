import { ApiClient } from "@/lib/api/api-client";
import type { PanelSettingsResponse, PanelSettings, DynamicPanelConfig, PanelCounts } from "@/types/panel-config-types";

export const receptionPanelSettingsService = {
  // 병원별 패널 설정 조회
  async getPanelSettings(hospitalId: string): Promise<PanelSettings> {
    const response = await ApiClient.get<PanelSettingsResponse>(`/panel-settings/${hospitalId}`);
    return response.data;
  },

  // 패널 설정 업데이트
  async updatePanelSettings(hospitalId: string, settings: PanelSettings): Promise<PanelSettings> {
    const response = await ApiClient.put<PanelSettingsResponse>(`/panel-settings/${hospitalId}`, settings);
    return response.data;
  },

  // 패널 개수로부터 실제 패널들을 생성하는 함수
  generatePanelsFromCounts(panelCounts: PanelCounts): DynamicPanelConfig[] {
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
        name: roomName,
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
      const roomName = `수납${i}`;
      panels.push({
        id: `payment-${i}`,
        name: roomName,
        icon: "💰",
        type: "payment",
        roomName: roomName,
        dataSource: "registrations",
        filter: (registrations: any[]) => registrations.filter(f => f.roomPanel === roomName),
        order: order++,
        isActive: true
      });
    }

    return panels;
  },


  async createDefaultPanelSettings(hospitalId: string): Promise<PanelSettings> {
    const defaultCounts: PanelCounts = {
      appointment: 1,
      treatment: 1,
      payment: 1
    };

    const defaultPanels = this.generatePanelsFromCounts(defaultCounts);

    const defaultSettings: PanelSettings = {
      hospitalId,
      panelCounts: defaultCounts,
      panels: defaultPanels
    };

    const response = await ApiClient.post<PanelSettingsResponse>(`/panel-settings`, defaultSettings);
    return response.data;
  },

  // 패널 설정을 DockingPanel용 PanelConfig로 변환
  convertToPanelConfigs(panelSettings: PanelSettings): any[] {
    return panelSettings.panels
      .filter(panel => panel.isActive)
      .sort((a, b) => a.order - b.order)
      .map(panel => ({
        id: panel.id,
        name: panel.name,
        icon: panel.icon,
        dataSource: panel.dataSource,
        filter: panel.filter
      }));
  },

  // 환경설정에서 호출할 함수 - 패널 개수 업데이트
  async updatePanelCountsFromSettings(hospitalId: string, panelCounts: PanelCounts): Promise<PanelSettings> {
    // 새로운 패널들을 생성
    const newPanels = this.generatePanelsFromCounts(panelCounts);

    // 새로운 설정 객체 생성
    const newSettings: PanelSettings = {
      hospitalId,
      panelCounts,
      panels: newPanels
    };

    // API로 업데이트
    const response = await this.updatePanelSettings(hospitalId, newSettings);
    return response;
  }
}; 