import type React from "react";

// ===== ID Types =====
export type NodeId = string;
export type TabId = string;

// ===== Layout Node (Discriminated Union) =====
export type LayoutNode = BoxNode | PanelNode;

export interface BoxNode {
  type: "box";
  id: NodeId;
  mode: "horizontal" | "vertical";
  children: LayoutNode[];
  /** Flex sizes for each child. Length must match children.length. */
  sizes: number[];
}

export interface PanelNode {
  type: "panel";
  id: NodeId;
  tabs: TabData[];
  activeTabId: TabId;
  /** Group name for restricting which tabs can be dragged here */
  group?: string;
  /** Lock configuration */
  panelLock?: PanelLockConfig;
}

// ===== Tab Data =====
export interface TabData {
  id: TabId;
  title: string | React.ReactNode;
  /** Group restricts which panels this tab can be dropped into */
  group?: string;
  /** If false, tab cannot be closed (default: true) */
  closable?: boolean;
  /** If true, tab cannot be dragged */
  locked?: boolean;
  /** Arbitrary metadata passed through to content renderers */
  data?: Record<string, unknown>;
}

// ===== Float Panel =====
export interface FloatPanelData {
  id: NodeId;
  panel: PanelNode;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  /** If true, show close button on float panel (default: false) */
  closable?: boolean;
}

// ===== Complete Layout =====
export interface DockLayout {
  /** Root dockbox node */
  dockbox: BoxNode;
  /** Floating panels (Phase 6 - deferred) */
  floatbox?: FloatPanelData[];
}

// ===== Panel Lock =====
export interface PanelLockConfig {
  /** Prevent all tab movement in/out */
  locked?: boolean;
  /** Prevent panel from being detached to float */
  noFloat?: boolean;
  /** Allow/disallow maximize */
  maximizable?: boolean;
  /** Prevent closing tabs */
  noClose?: boolean;
}

// ===== Dock Position (drop target) =====
export type DockPosition = "left" | "right" | "top" | "bottom" | "center";

export interface DockTarget {
  /** The panel being docked into */
  targetPanelId: NodeId;
  /** Where relative to the target */
  position: DockPosition;
}

// ===== Drag State =====
export type DragItemType = "tab" | "panel";

export interface DockDragState {
  isDragging: boolean;
  dragItemType: DragItemType | null;
  /** The tab being dragged */
  dragTabId: TabId | null;
  /** The panel the tab is being dragged FROM */
  sourcePanelId: NodeId | null;
  /** Current pointer position */
  pointerPosition: { x: number; y: number } | null;
  /** Currently hovered dock target */
  dockTarget: DockTarget | null;
  /** Preview rectangle for dock indicator */
  previewRect: { x: number; y: number; width: number; height: number } | null;
  /** Source panel dimensions for drag overlay */
  sourcePanelRect: { width: number; height: number } | null;
  /** Drag offset from pointer to panel top-left */
  dragOffset: { x: number; y: number } | null;
}

// ===== Serialized Layout (JSON-safe) =====
export interface SerializedLayout {
  dockbox: SerializedBoxNode;
  floatbox?: SerializedFloatPanel[];
}

export interface SerializedBoxNode {
  type: "box";
  id: NodeId;
  mode: "horizontal" | "vertical";
  children: (SerializedBoxNode | SerializedPanelNode)[];
  sizes: number[];
}

export interface SerializedPanelNode {
  type: "panel";
  id: NodeId;
  tabs: { id: TabId; title?: string; group?: string; data?: Record<string, unknown> }[];
  activeTabId: TabId;
  group?: string;
  panelLock?: PanelLockConfig;
}

export interface SerializedFloatPanel {
  id: NodeId;
  panel: SerializedPanelNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ===== Tab Content Loader =====
/**
 * Maps a tab to its React content.
 * Called whenever a tab needs rendering.
 */
export type TabContentLoader = (tab: TabData) => React.ReactNode;

/**
 * Optional per-tab extra zone renderer.
 * Renders extra buttons beside the tab bar for the active tab.
 */
export type PanelExtraRenderer = (
  activeTab: TabData,
  panelId: NodeId
) => React.ReactNode | null;

// ===== Settings Config (matches existing pattern) =====
export interface DockLayoutSettingsConfig {
  scope: "system" | "user";
  category: string;
  pageContext: string;
}

// ===== Group Config =====
export interface GroupConfig {
  /** Whether panels in this group can be maximized */
  maximizable?: boolean;
  /** Custom extra zone renderer for panels in this group */
  panelExtra?: PanelExtraRenderer;
}

// ===== DockWorkspace Props =====
export interface DockWorkspaceProps {
  /** Default layout (uncontrolled mode) */
  defaultLayout?: DockLayout;
  /** Controlled layout */
  layout?: DockLayout;
  /** Callback when layout changes */
  onLayoutChange?: (layout: DockLayout) => void;

  /** Maps tab ID to its React content */
  loadTab: TabContentLoader;
  /** Optional: extra buttons/controls rendered beside tab bar (right side) */
  panelExtra?: PanelExtraRenderer;
  /** Optional: extra controls rendered on the left side of tab bar (after tabs) */
  panelExtraLeft?: PanelExtraRenderer;

  /** Settings config for server-backed persistence */
  settingsConfig?: DockLayoutSettingsConfig;
  /** Enable auto-save (default: true if settingsConfig provided) */
  enableAutoSave?: boolean;

  /** Group definitions with constraints */
  groups?: Record<string, GroupConfig>;

  /** Whether tabs can be detached to float panels by dragging outside (default: true) */
  floatable?: boolean;
  /** Whether float panels show a close button (default: false) */
  floatClosable?: boolean;

  className?: string;
  style?: React.CSSProperties;
  theme?: "light" | "dark";

  onTabClick?: (tabId: TabId, panelId: NodeId) => void;
  onTabClose?: (tabId: TabId, panelId: NodeId) => boolean | void;
  onPanelFocus?: (panelId: NodeId) => void;
}

// ===== DockWorkspace Ref (imperative API) =====
export interface DockWorkspaceRef {
  saveLayout: () => SerializedLayout;
  loadLayout: (layout: SerializedLayout) => void;
  getCurrentLayout: () => DockLayout;
  resetLayout: () => void;

  addTab: (panelId: NodeId, tab: TabData, index?: number) => void;
  removeTab: (panelId: NodeId, tabId: TabId) => void;
  addPanel: (
    targetNodeId: NodeId,
    position: DockPosition,
    panel: PanelNode
  ) => void;
  removePanel: (panelId: NodeId) => void;

  find: (nodeId: NodeId) => LayoutNode | null;
  updateTab: (tabId: TabId, updates: Partial<TabData>) => void;
  dockMove: (
    sourceTabId: TabId,
    targetPanelId: NodeId,
    position: DockPosition
  ) => void;
}
