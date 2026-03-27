// ===== Layout Defaults =====
export const DEFAULT_TAB_HEIGHT = 32;
export const DEFAULT_SPLITTER_WIDTH = 6;
export const DEFAULT_MIN_PANEL_SIZE = 50;
export const DEFAULT_DRAG_THRESHOLD = 5;

// ===== Z-Index =====
export const Z_INDEX = {
  PANEL: 1,
  SPLITTER: 10,
  FLOAT_PANEL_BASE: 200,
  DOCK_PREVIEW: 9998,
  DRAG_OVERLAY: 9999,
} as const;

// ===== Drop Zone Ratios =====
/** Percentage of panel edge for edge-dock hit detection */
export const EDGE_ZONE_RATIO = 0.2;
/** Percentage of panel center for center-dock (tab merge) hit detection */
export const CENTER_ZONE_RATIO = 0.4;
/** Minimum overlap ratio for dock target activation (overlay vs panel) */
export const DOCK_OVERLAP_THRESHOLD = 0.5;

// ===== Drag Overlay Size =====
export const OVERLAY_MAX_WIDTH = 280;
export const OVERLAY_MAX_HEIGHT = 200;
export const OVERLAY_MIN_WIDTH = 160;
export const OVERLAY_MIN_HEIGHT = 100;

// ===== Auto-save =====
export const AUTO_SAVE_DEBOUNCE_MS = 500;

// ===== Node ID generation =====
let idCounter = 0;
export function generateNodeId(prefix = "node"): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
