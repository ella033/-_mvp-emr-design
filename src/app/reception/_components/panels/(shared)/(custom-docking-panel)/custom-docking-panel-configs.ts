/**
 * Custom Docking Panel Configurations
 *
 * 기존 docking-panel-configs.ts와 동일한 API를 제공하되,
 * rc-dock 의존성 없이 커스텀 DockWorkspace와 연동된다.
 */

import type { Appointment } from "@/types/appointments/appointments";
import type { Registration } from "@/types/registration-types";
import type { DockLayout, BoxNode, PanelNode, TabData } from "@/components/dock-workspace";
import { PANEL_TYPE, type PanelTypeKey } from "@/constants/reception";
import {
  AppointmentStatus,
  PaymentStatus,
} from "@/constants/common/common-enum";

// ===== Panel Types (기존 custom-docking-types.ts에서 병합) =====

export type PanelType = "appointment" | "treatment" | "payment" | "chat";
export type DataSourceType = Appointment[] | Registration[];

export interface CustomPanelConfig {
  id: string;
  name: string;
  icon: string;
  type?: PanelType;
  roomName?: string;
  dataSource?: DataSourceType;
  filter?: (data: any[]) => any;
  isVisible?: boolean;
  order?: number;
  titleCount?: number;
  typeSpecificConfig?: AppointmentConfig | TreatmentConfig | PaymentConfig;
}

interface AppointmentConfig {
  departments?: number[];
  appointmentRooms?: number[];
  allowedStatuses?: string[];
}

interface TreatmentConfig {
  departments?: number[];
  facilityIds?: number[];
  allowedStatuses?: string[];
}

interface PaymentConfig {
  paymentMethods?: string[];
  allowedStatuses?: string[];
}

export { PANEL_TYPE };
export type { PanelTypeKey };

// ===== Base Panel Configs =====

export const PANEL_BASE_CONFIGS: Record<
  PanelTypeKey,
  Omit<CustomPanelConfig, "id">
> = {
  appointment: {
    name: "예약",
    icon: "",
    type: PANEL_TYPE.APPOINTMENT as PanelType,
    dataSource: [],
    roomName: "appointment-room",
    titleCount: 0,
  },
  treatment: {
    name: "진료실",
    icon: "",
    type: PANEL_TYPE.TREATMENT as PanelType,
    dataSource: [],
    roomName: "treatment-room",
    titleCount: 0,
  },
  payment: {
    name: "수납",
    icon: "",
    type: PANEL_TYPE.PAYMENT as PanelType,
    dataSource: [],
    roomName: "payment-room",
    titleCount: 0,
  },
  chat: {
    name: "환자메모",
    icon: "",
    type: PANEL_TYPE.CHAT as PanelType,
    dataSource: [],
    roomName: "chat-room",
    titleCount: 0,
  },
};

// ===== Panel Presets =====

export const PANEL_PRESETS = {
  all: { appointment: true, treatment: true, payment: true, chat: true },
  appointmentOnly: { appointment: true, treatment: false, payment: false, chat: false },
  treatmentOnly: { appointment: false, treatment: true, payment: false, chat: false },
  paymentOnly: { appointment: false, treatment: false, payment: true, chat: false },
  appointmentAndTreatment: { appointment: true, treatment: true, payment: false, chat: false },
  treatmentAndPayment: { appointment: false, treatment: true, payment: true, chat: false },
} as const;

// ===== Panel Metadata =====

export const PANEL_METADATA: Record<
  PanelTypeKey,
  {
    description: string;
    defaultFilters: string[];
    supportedStatuses: string[];
    hasDropdown: boolean;
    hasSort: boolean;
    statusTabs: {
      key: string | AppointmentStatus | PaymentStatus;
      label: string;
      icon?: string;
    }[];
    titleIcon: string;
    titleLabel: string;
  }
> = {
  appointment: {
    description: "예약 관리 패널",
    defaultFilters: [],
    supportedStatuses: ["PENDING", "CONFIRMED", "VISITED", "NOSHOW", "CANCELED"],
    hasDropdown: true,
    hasSort: false,
    statusTabs: [
      { key: AppointmentStatus.PENDING, label: "대기" },
      { key: AppointmentStatus.CONFIRMED, label: "예약" },
      { key: AppointmentStatus.VISITED, label: "내원" },
      { key: AppointmentStatus.NOSHOW, label: "노쇼" },
      { key: AppointmentStatus.CANCELED, label: "취소" },
    ],
    titleIcon: "",
    titleLabel: "총",
  },
  treatment: {
    description: "진료실 관리 패널",
    defaultFilters: ["treatmentRoom"],
    supportedStatuses: [],
    hasDropdown: true,
    hasSort: false,
    statusTabs: [],
    titleIcon: "",
    titleLabel: "총",
  },
  payment: {
    description: "수납실 관리 패널",
    defaultFilters: [],
    supportedStatuses: ["pending", "completed"],
    hasDropdown: false,
    hasSort: false,
    statusTabs: [
      { key: PaymentStatus.PENDING, label: "대기" },
      { key: PaymentStatus.COMPLETED, label: "완료" },
    ],
    titleIcon: "💰",
    titleLabel: "총",
  },
  chat: {
    description: "환자 메모 패널",
    defaultFilters: [],
    supportedStatuses: [],
    hasDropdown: false,
    hasSort: false,
    statusTabs: [],
    titleIcon: "",
    titleLabel: "",
  },
};

// ===== Factory Functions =====

export function createCustomPanelConfig(
  panelType: PanelTypeKey,
  customId?: string,
  overrides?: Partial<CustomPanelConfig>
): CustomPanelConfig {
  const baseConfig = PANEL_BASE_CONFIGS[panelType];
  return {
    id: customId || `${panelType}-panel`,
    ...baseConfig,
    ...overrides,
  };
}

export function createCustomPanelConfigs(
  enabledPanels: Partial<Record<PanelTypeKey, boolean>>,
  customConfigs?: Partial<Record<PanelTypeKey, Partial<CustomPanelConfig>>>
): CustomPanelConfig[] {
  const configs: CustomPanelConfig[] = [];
  (Object.keys(enabledPanels) as PanelTypeKey[]).forEach((panelType) => {
    if (enabledPanels[panelType]) {
      const customConfig = customConfigs?.[panelType];
      configs.push(createCustomPanelConfig(panelType, undefined, customConfig));
    }
  });
  return configs;
}

export function createCustomPanelConfigsFromPreset(
  presetName: keyof typeof PANEL_PRESETS,
  customConfigs?: Partial<Record<PanelTypeKey, Partial<CustomPanelConfig>>>
): CustomPanelConfig[] {
  const preset = PANEL_PRESETS[presetName];
  return createCustomPanelConfigs(preset, customConfigs);
}

// ===== Metadata Helpers =====

export function getPanelMetadata(panelType: PanelTypeKey) {
  return PANEL_METADATA[panelType];
}

export function getStatusTabsByPanelType(panelType: PanelTypeKey | string) {
  if (typeof panelType === "string" && !(panelType in PANEL_METADATA)) {
    const nameMap: Record<string, PanelTypeKey> = {
      예약: PANEL_TYPE.APPOINTMENT,
      진료실: PANEL_TYPE.TREATMENT,
      진료: PANEL_TYPE.TREATMENT,
      수납실: PANEL_TYPE.PAYMENT,
      수납: PANEL_TYPE.PAYMENT,
    };
    const mapped = nameMap[panelType];
    return mapped ? PANEL_METADATA[mapped]?.statusTabs ?? [] : [];
  }
  return PANEL_METADATA[panelType as PanelTypeKey]?.statusTabs ?? [];
}

export function getTitleIconByPanelType(panelType: PanelTypeKey | string) {
  if (typeof panelType === "string" && !(panelType in PANEL_METADATA)) {
    const nameMap: Record<string, PanelTypeKey> = {
      예약: PANEL_TYPE.APPOINTMENT,
      진료실: PANEL_TYPE.TREATMENT,
      수납: PANEL_TYPE.PAYMENT,
    };
    const mapped = nameMap[panelType];
    return mapped ? PANEL_METADATA[mapped]?.titleIcon ?? "" : "";
  }
  return PANEL_METADATA[panelType as PanelTypeKey]?.titleIcon ?? "";
}

export function getTitleLabelByPanelType(panelType: PanelTypeKey | string) {
  if (typeof panelType === "string" && !(panelType in PANEL_METADATA)) {
    const nameMap: Record<string, PanelTypeKey> = {
      예약: PANEL_TYPE.APPOINTMENT,
      진료실: PANEL_TYPE.TREATMENT,
      수납: PANEL_TYPE.PAYMENT,
    };
    const mapped = nameMap[panelType];
    return mapped ? PANEL_METADATA[mapped]?.titleLabel ?? "총" : "총";
  }
  return PANEL_METADATA[panelType as PanelTypeKey]?.titleLabel ?? "총";
}

export function getEnabledPanelTypes(
  enabledPanels: Partial<Record<PanelTypeKey, boolean>>
): PanelTypeKey[] {
  return (Object.keys(enabledPanels) as PanelTypeKey[]).filter(
    (panelType) => enabledPanels[panelType]
  );
}

// ===== DockLayout Builder =====

/**
 * CustomPanelConfig 배열로부터 DockWorkspace의 DockLayout을 생성한다.
 * 기존 docking-panel-provider.tsx의 defaultLayout 생성 로직을 대체.
 *
 * 기본 레이아웃:
 * - 왼쪽: 예약 패널들 (세로 스택)
 * - 오른쪽: 진료실 + 수납 패널들 (세로 스택)
 */
export function buildDefaultDockLayout(
  panels: CustomPanelConfig[]
): DockLayout {
  const appointmentPanels = panels.filter((p) => p.type === PANEL_TYPE.APPOINTMENT);
  const treatmentPanels = panels.filter((p) => p.type === PANEL_TYPE.TREATMENT);
  const paymentPanels = panels.filter((p) => p.type === PANEL_TYPE.PAYMENT);
  const chatPanels = panels.filter((p) => p.type === PANEL_TYPE.CHAT);

  const makePanelNode = (config: CustomPanelConfig): PanelNode => {
    // 수납 패널은 수납대기/수납완료 두 개 탭으로 분리
    if (config.type === PANEL_TYPE.PAYMENT) {
      const pendingTabId = `${config.id}-pending`;
      const completedTabId = `${config.id}-completed`;
      return {
        type: "panel",
        id: config.id,
        tabs: [
          {
            id: pendingTabId,
            title: "수납대기",
            closable: false,
            data: { panelType: config.type, paymentFilter: "pending" },
          } as TabData,
          {
            id: completedTabId,
            title: "수납완료",
            closable: false,
            data: { panelType: config.type, paymentFilter: "completed" },
          } as TabData,
        ],
        activeTabId: pendingTabId,
        panelLock: { maximizable: false, noClose: true },
      };
    }

    return {
      type: "panel",
      id: config.id,
      tabs: [
        {
          id: config.id,
          title: `${config.icon} ${config.name}`.trim(),
          closable: false,
          data: { panelType: config.type },
        } as TabData,
      ],
      activeTabId: config.id,
      panelLock: { maximizable: false, noClose: true },
    };
  };

  const leftPanels = appointmentPanels.map(makePanelNode);
  const rightPanels = [...treatmentPanels, ...paymentPanels, ...chatPanels].map(makePanelNode);

  // Handle edge cases
  if (leftPanels.length === 0 && rightPanels.length === 0) {
    return {
      dockbox: {
        type: "box",
        id: "root",
        mode: "horizontal",
        children: [],
        sizes: [],
      },
    };
  }

  if (leftPanels.length === 0) {
    return {
      dockbox: buildVerticalBox("root", rightPanels),
    };
  }

  if (rightPanels.length === 0) {
    return {
      dockbox: buildVerticalBox("root", leftPanels),
    };
  }

  // Both sides have panels
  const leftBox = buildVerticalBox("left-col", leftPanels);
  const rightBox = buildVerticalBox("right-col", rightPanels);

  return {
    dockbox: {
      type: "box",
      id: "root",
      mode: "horizontal",
      children: [leftBox, rightBox],
      sizes: [1, 1],
    },
  };
}

function buildVerticalBox(id: string, panels: PanelNode[]): BoxNode {
  if (panels.length === 1) {
    // Single panel: still wrap in box for consistency
    return {
      type: "box",
      id,
      mode: "vertical",
      children: panels,
      sizes: [1],
    };
  }

  return {
    type: "box",
    id,
    mode: "vertical",
    children: panels,
    sizes: panels.map(() => 1),
  };
}
