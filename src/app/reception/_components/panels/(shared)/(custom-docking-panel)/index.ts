// ===== Components =====
// CustomDockingPanelHeader 제거됨 → PanelTabExtra(panel-tab-extra.tsx)로 대체

// ===== Types =====
export type {
  CustomPanelConfig,
  PanelType,
  DataSourceType,
} from "./custom-docking-panel-configs";

// ===== Types from Header =====
export type {
  DropdownConfig,
  HeaderOptions,
} from "./custom-docking-panel-header";

// ===== Configurations =====
export {
  PANEL_BASE_CONFIGS,
  PANEL_PRESETS,
  PANEL_METADATA,
  PANEL_TYPE,
  createCustomPanelConfig,
  createCustomPanelConfigs,
  createCustomPanelConfigsFromPreset,
  getPanelMetadata,
  getStatusTabsByPanelType,
  getTitleIconByPanelType,
  getTitleLabelByPanelType,
  getEnabledPanelTypes,
  buildDefaultDockLayout,
} from "./custom-docking-panel-configs";

export type { PanelTypeKey } from "./custom-docking-panel-configs";
