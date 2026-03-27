/**
 * Layout Tree Utility Functions
 *
 * Pure functions for immutable layout tree manipulation.
 * All functions return NEW objects - never mutate input.
 */

import type {
  DockLayout,
  LayoutNode,
  BoxNode,
  PanelNode,
  TabData,
  TabId,
  NodeId,
  DockPosition,
} from "../types";
import { generateNodeId } from "../constants";

// ===== Node Creation Helpers =====

export function createBoxNode(
  mode: "horizontal" | "vertical",
  children: LayoutNode[],
  sizes?: number[],
  id?: string
): BoxNode {
  return {
    type: "box",
    id: id ?? generateNodeId("box"),
    mode,
    children,
    sizes: sizes ?? children.map(() => 1),
  };
}

export function createPanelNode(
  tabs: TabData[],
  options?: {
    id?: string;
    activeTabId?: TabId;
    group?: string;
    panelLock?: PanelNode["panelLock"];
  }
): PanelNode {
  return {
    type: "panel",
    id: options?.id ?? generateNodeId("panel"),
    tabs,
    activeTabId: options?.activeTabId ?? tabs[0]?.id ?? "",
    group: options?.group,
    panelLock: options?.panelLock,
  };
}

export function createTabData(
  id: string,
  title: string,
  options?: Partial<Omit<TabData, "id" | "title">>
): TabData {
  return { id, title, ...options };
}

// ===== Tree Traversal =====

/** Find a PanelNode by ID in the layout tree */
export function findPanelById(
  layout: DockLayout,
  panelId: NodeId
): PanelNode | null {
  const found = findPanelInNode(layout.dockbox, panelId);
  if (found) return found;
  // Also search floatbox
  for (const fp of layout.floatbox ?? []) {
    if (fp.panel.id === panelId) return fp.panel;
  }
  return null;
}

function findPanelInNode(
  node: LayoutNode,
  panelId: NodeId
): PanelNode | null {
  if (node.type === "panel") {
    return node.id === panelId ? node : null;
  }
  for (const child of node.children) {
    const found = findPanelInNode(child, panelId);
    if (found) return found;
  }
  return null;
}

/** Find a TabData by ID across all panels */
export function findTabById(
  layout: DockLayout,
  tabId: TabId
): { panel: PanelNode; tab: TabData } | null {
  const found = findTabInNode(layout.dockbox, tabId);
  if (found) return found;
  // Also search floatbox
  for (const fp of layout.floatbox ?? []) {
    const tab = fp.panel.tabs.find((t) => t.id === tabId);
    if (tab) return { panel: fp.panel, tab };
  }
  return null;
}

function findTabInNode(
  node: LayoutNode,
  tabId: TabId
): { panel: PanelNode; tab: TabData } | null {
  if (node.type === "panel") {
    const tab = node.tabs.find((t) => t.id === tabId);
    return tab ? { panel: node, tab } : null;
  }
  for (const child of node.children) {
    const found = findTabInNode(child, tabId);
    if (found) return found;
  }
  return null;
}

/** Find a node by ID (box or panel) */
export function findNodeById(
  layout: DockLayout,
  nodeId: NodeId
): LayoutNode | null {
  return findNodeInNode(layout.dockbox, nodeId);
}

function findNodeInNode(
  node: LayoutNode,
  nodeId: NodeId
): LayoutNode | null {
  if (node.id === nodeId) return node;
  if (node.type === "box") {
    for (const child of node.children) {
      const found = findNodeInNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/** Find the path of node IDs from root to the target node */
export function findNodePath(
  root: LayoutNode,
  nodeId: NodeId
): NodeId[] {
  if (root.id === nodeId) return [root.id];
  if (root.type === "box") {
    for (const child of root.children) {
      const path = findNodePath(child, nodeId);
      if (path.length > 0) return [root.id, ...path];
    }
  }
  return [];
}

/** Collect all panel IDs in the layout */
export function getAllPanelIds(layout: DockLayout): NodeId[] {
  const ids: NodeId[] = [];
  collectPanelIds(layout.dockbox, ids);
  return ids;
}

function collectPanelIds(node: LayoutNode, ids: NodeId[]): void {
  if (node.type === "panel") {
    ids.push(node.id);
  } else {
    node.children.forEach((child) => collectPanelIds(child, ids));
  }
}

// ===== Tab Operations =====

/** Add a tab to a panel */
export function addTabToPanel(
  layout: DockLayout,
  panelId: NodeId,
  tab: TabData,
  index?: number
): DockLayout {
  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "panel" || node.id !== panelId) return node;
      const newTabs = [...node.tabs];
      if (index !== undefined && index >= 0 && index <= newTabs.length) {
        newTabs.splice(index, 0, tab);
      } else {
        newTabs.push(tab);
      }
      return { ...node, tabs: newTabs, activeTabId: tab.id };
    }) as BoxNode,
  };
}

/** Remove a tab from a panel. If the panel becomes empty, it stays (cleanup handles removal). */
export function removeTabFromPanel(
  layout: DockLayout,
  panelId: NodeId,
  tabId: TabId
): DockLayout {
  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "panel" || node.id !== panelId) return node;
      const newTabs = node.tabs.filter((t) => t.id !== tabId);
      const newActiveTabId =
        node.activeTabId === tabId
          ? newTabs[0]?.id ?? ""
          : node.activeTabId;
      return { ...node, tabs: newTabs, activeTabId: newActiveTabId };
    }) as BoxNode,
  };
}

/** Set the active tab in a panel */
export function setActiveTab(
  layout: DockLayout,
  panelId: NodeId,
  tabId: TabId
): DockLayout {
  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "panel" || node.id !== panelId) return node;
      return { ...node, activeTabId: tabId };
    }) as BoxNode,
  };
}

/** Update tab data */
export function updateTab(
  layout: DockLayout,
  panelId: NodeId,
  tabId: TabId,
  updates: Partial<TabData>
): DockLayout {
  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "panel" || node.id !== panelId) return node;
      const newTabs = node.tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      );
      return { ...node, tabs: newTabs };
    }) as BoxNode,
  };
}

// ===== Panel Split Operations =====

/**
 * Split a panel by inserting a new panel at the given position.
 *
 * - center: merge tabs into existing panel
 * - left/right: create horizontal BoxNode wrapping target + new panel
 * - top/bottom: create vertical BoxNode wrapping target + new panel
 */
export function splitPanel(
  layout: DockLayout,
  targetPanelId: NodeId,
  newPanel: PanelNode,
  position: DockPosition
): DockLayout {
  if (position === "center") {
    // Merge tabs into target panel
    let result = layout;
    for (const tab of newPanel.tabs) {
      result = addTabToPanel(result, targetPanelId, tab);
    }
    return result;
  }

  // Edge split: wrap target in a new BoxNode
  const splitMode: "horizontal" | "vertical" =
    position === "left" || position === "right" ? "horizontal" : "vertical";
  const insertBefore = position === "left" || position === "top";

  return {
    ...layout,
    dockbox: replaceNodeById(layout.dockbox, targetPanelId, (targetNode) => {
      const children: LayoutNode[] = insertBefore
        ? [newPanel, targetNode]
        : [targetNode, newPanel];

      return createBoxNode(splitMode, children, [1, 1]);
    }) as BoxNode,
  };
}

// ===== Move Tab =====

/**
 * Core docking operation: move a tab from one panel to another.
 *
 * - Removes tab from source panel
 * - If position is 'center', adds tab to target panel's tab list
 * - If position is edge, splits the target panel
 * - Cleans up empty panels and degenerate boxes
 */
export function moveTab(
  layout: DockLayout,
  sourcePanelId: NodeId,
  targetPanelId: NodeId,
  tabId: TabId,
  position: DockPosition
): DockLayout {
  // 1. Find the tab data before removing
  const tabInfo = findTabById(layout, tabId);
  if (!tabInfo) return layout;
  const tab = { ...tabInfo.tab };

  // Group restriction: block move if tab group doesn't match target panel group
  if (position === "center") {
    const targetPanel = findPanelById(layout, targetPanelId);
    if (targetPanel?.group && tab.group && targetPanel.group !== tab.group) {
      return layout;
    }
  }

  // 2. Remove tab from source panel
  let newLayout = removeTabFromPanel(layout, sourcePanelId, tabId);

  // 3. Dock at target
  if (position === "center") {
    newLayout = addTabToPanel(newLayout, targetPanelId, tab);
  } else {
    const newPanel = createPanelNode([tab], {
      group: tab.group,
    });
    newLayout = splitPanel(newLayout, targetPanelId, newPanel, position);
  }

  // 4. Cleanup: remove empty panels, collapse single-child boxes
  newLayout = cleanupLayout(newLayout);

  return newLayout;
}

// ===== Panel Operations =====

/** Add a new panel at a position relative to a target node */
export function addPanel(
  layout: DockLayout,
  targetNodeId: NodeId,
  position: DockPosition,
  panel: PanelNode
): DockLayout {
  // Find if target is a panel (split it) or a box (add child)
  const targetNode = findNodeById(layout, targetNodeId);
  if (!targetNode) return layout;

  if (targetNode.type === "panel") {
    return splitPanel(layout, targetNodeId, panel, position);
  }

  // Target is a box: add as a new child
  const box = targetNode as BoxNode;
  const insertBefore = position === "left" || position === "top";

  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "box" || node.id !== box.id) return node;
      const newChildren = insertBefore
        ? [panel, ...node.children]
        : [...node.children, panel];
      const newSizes = insertBefore
        ? [1, ...node.sizes]
        : [...node.sizes, 1];
      return { ...node, children: newChildren, sizes: newSizes };
    }) as BoxNode,
  };
}

/** Remove a panel from the layout */
export function removePanel(
  layout: DockLayout,
  panelId: NodeId
): DockLayout {
  return cleanupLayout({
    ...layout,
    dockbox: removeNodeById(layout.dockbox, panelId) as BoxNode,
  });
}

// ===== Resize Operations =====

/**
 * Resize a split by adjusting the sizes array of a BoxNode.
 * @param pixelDelta - the pixel delta to apply
 * @param totalSize - the total pixel size of the box container
 */
export function resizeSplit(
  layout: DockLayout,
  boxId: NodeId,
  childIndex: number,
  pixelDelta: number,
  totalSize: number,
  minSize = 50
): DockLayout {
  return {
    ...layout,
    dockbox: mapNode(layout.dockbox, (node) => {
      if (node.type !== "box" || node.id !== boxId) return node;
      if (childIndex < 0 || childIndex >= node.sizes.length - 1) return node;

      const sizes = [...node.sizes];
      const totalRatio = sizes.reduce((a, b) => a + b, 0);

      // Convert pixel delta to ratio delta
      const ratioDelta = totalSize > 0 ? (pixelDelta / totalSize) * totalRatio : 0;

      // Apply delta
      let newSize1 = (sizes[childIndex] ?? 1) + ratioDelta;
      let newSize2 = (sizes[childIndex + 1] ?? 1) - ratioDelta;

      // Enforce min sizes
      const minRatio = totalSize > 0 ? (minSize / totalSize) * totalRatio : 0.05;
      if (newSize1 < minRatio) {
        newSize2 -= minRatio - newSize1;
        newSize1 = minRatio;
      }
      if (newSize2 < minRatio) {
        newSize1 -= minRatio - newSize2;
        newSize2 = minRatio;
      }

      sizes[childIndex] = Math.max(newSize1, minRatio);
      sizes[childIndex + 1] = Math.max(newSize2, minRatio);

      return { ...node, sizes };
    }) as BoxNode,
  };
}

// ===== Cleanup =====

/**
 * Clean up the layout tree:
 * 1. Remove PanelNodes with zero tabs
 * 2. Collapse BoxNodes with a single child (unwrap the child)
 * 3. Merge nested BoxNodes with the same mode
 */
export function cleanupLayout(layout: DockLayout): DockLayout {
  const cleaned = cleanupNode(layout.dockbox);
  // Ensure we always have a valid root
  if (!cleaned) {
    return {
      ...layout,
      dockbox: createBoxNode("horizontal", []),
    };
  }
  // If root became a panel, wrap it in a box
  if (cleaned.type === "panel") {
    return {
      ...layout,
      dockbox: createBoxNode("horizontal", [cleaned], [1]),
    };
  }
  return { ...layout, dockbox: cleaned };
}

function cleanupNode(node: LayoutNode): LayoutNode | null {
  if (node.type === "panel") {
    // Remove panels with no tabs
    return node.tabs.length === 0 ? null : node;
  }

  // Recursively clean children
  let children: LayoutNode[] = [];
  const sizes: number[] = [];
  for (let i = 0; i < node.children.length; i++) {
    const childNode = node.children[i];
    if (!childNode) continue;
    const cleaned = cleanupNode(childNode);
    if (cleaned) {
      children.push(cleaned);
      sizes.push(node.sizes[i] ?? 1);
    }
  }

  // Remove empty boxes
  if (children.length === 0) return null;

  // Collapse single-child boxes
  if (children.length === 1) return children[0]!;

  // Merge nested boxes with the same mode
  const mergedChildren: LayoutNode[] = [];
  const mergedSizes: number[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    if (child.type === "box" && child.mode === node.mode) {
      // Flatten nested box with same mode
      const childTotalSize = child.sizes.reduce((a: number, b: number) => a + b, 0);
      const parentSize = sizes[i] ?? 1;
      for (let j = 0; j < child.children.length; j++) {
        mergedChildren.push(child.children[j]!);
        mergedSizes.push(
          childTotalSize > 0
            ? ((child.sizes[j] ?? 1) / childTotalSize) * parentSize
            : parentSize / child.children.length
        );
      }
    } else {
      mergedChildren.push(child);
      mergedSizes.push(sizes[i] ?? 1);
    }
  }

  // After merging, check single-child again
  if (mergedChildren.length === 1) return mergedChildren[0]!;

  return { ...node, children: mergedChildren, sizes: mergedSizes };
}

// ===== Internal Tree Map/Replace Utilities =====

/** Map over all nodes in the tree, returning new tree with mapped nodes */
function mapNode(
  node: LayoutNode,
  fn: (node: LayoutNode) => LayoutNode
): LayoutNode {
  const mapped = fn(node);
  if (mapped.type === "box") {
    const newChildren = mapped.children.map((child) => mapNode(child, fn));
    const childrenChanged = newChildren.some(
      (c, i) => c !== mapped.children[i]
    );
    return childrenChanged
      ? { ...mapped, children: newChildren }
      : mapped;
  }
  return mapped;
}

/** Replace a node by ID with the result of a transform function */
function replaceNodeById(
  node: LayoutNode,
  nodeId: NodeId,
  transform: (node: LayoutNode) => LayoutNode
): LayoutNode {
  if (node.id === nodeId) return transform(node);
  if (node.type === "box") {
    const newChildren = node.children.map((child) =>
      replaceNodeById(child, nodeId, transform)
    );
    const changed = newChildren.some((c, i) => c !== node.children[i]);
    return changed ? { ...node, children: newChildren } : node;
  }
  return node;
}

/** Remove a node by ID from the tree */
function removeNodeById(
  node: LayoutNode,
  nodeId: NodeId
): LayoutNode | null {
  if (node.id === nodeId) return null;
  if (node.type === "box") {
    const newChildren: LayoutNode[] = [];
    const newSizes: number[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const result = removeNodeById(node.children[i]!, nodeId);
      if (result) {
        newChildren.push(result);
        newSizes.push(node.sizes[i] ?? 1);
      }
    }
    if (newChildren.length === node.children.length) return node; // Nothing removed
    if (newChildren.length === 0) return null;
    return { ...node, children: newChildren, sizes: newSizes };
  }
  return node;
}
