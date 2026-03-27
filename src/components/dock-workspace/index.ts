// ===== Main Component =====
export { DockWorkspace } from "./components/DockWorkspace";
export { useDockWorkspaceContext, useDockStore } from "./components/DockWorkspace";

// ===== Types =====
export type {
  DockLayout,
  BoxNode,
  PanelNode,
  TabData,
  FloatPanelData,
  DockPosition,
  PanelLockConfig,
  DockLayoutSettingsConfig,
  DockWorkspaceProps,
  DockWorkspaceRef,
  TabContentLoader,
  PanelExtraRenderer,
  GroupConfig,
  SerializedLayout,
  NodeId,
  TabId,
  LayoutNode,
  DockTarget,
  DockDragState,
} from "./types";

// ===== Layout Builder Helpers =====
export {
  createBoxNode,
  createPanelNode,
  createTabData,
} from "./store/layout-tree-utils";

// ===== Serialization =====
export {
  serializeLayout,
  deserializeLayout,
  migrateRcDockLayout,
} from "./store/serialization";

// ===== Hooks =====
export { useLayoutPersistence } from "./hooks/use-layout-persistence";

// ===== Panel Content DnD =====
export {
  PanelContentDnDProvider,
  usePanelContentDnD,
  useContentDraggable,
  useContentDropZone,
} from "./components/PanelContentDnD";
export type {
  ContentDragItem,
  ContentDropInfo,
} from "./components/PanelContentDnD";
