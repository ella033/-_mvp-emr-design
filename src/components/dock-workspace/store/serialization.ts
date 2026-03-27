/**
 * Layout Serialization / Deserialization
 *
 * Converts DockLayout to/from JSON-safe format.
 * Strips React content for persistence, restores via TabData registry.
 */

import type {
  DockLayout,
  BoxNode,
  PanelNode,
  TabData,
  SerializedLayout,
  SerializedBoxNode,
  SerializedPanelNode,
} from "../types";

// ===== Serialize =====

/**
 * Serialize a DockLayout to JSON-safe format.
 * Strips ReactNode titles, retaining only tab IDs, groups, and data.
 */
export function serializeLayout(layout: DockLayout): SerializedLayout {
  // floatbox는 세션 전용이므로 직렬화에서 제외 — 화면 이동 시 원복됨
  return {
    dockbox: serializeBoxNode(layout.dockbox),
  };
}

function serializeBoxNode(node: BoxNode): SerializedBoxNode {
  return {
    type: "box",
    id: node.id,
    mode: node.mode,
    sizes: [...node.sizes],
    children: node.children.map((child) =>
      child.type === "box"
        ? serializeBoxNode(child)
        : serializePanelNode(child as PanelNode)
    ),
  };
}

function serializePanelNode(node: PanelNode): SerializedPanelNode {
  return {
    type: "panel",
    id: node.id,
    activeTabId: node.activeTabId,
    group: node.group,
    panelLock: node.panelLock,
    tabs: node.tabs.map((tab) => ({
      id: tab.id,
      title: typeof tab.title === "string" ? tab.title : undefined,
      group: tab.group,
      data: tab.data,
    })),
  };
}

// ===== Deserialize =====

/**
 * Deserialize a JSON layout back to a full DockLayout.
 * Uses tabRegistry to reconstruct tab titles and metadata.
 */
export function deserializeLayout(
  serialized: SerializedLayout,
  tabRegistry: Map<string, TabData>
): DockLayout {
  // floatbox는 세션 전용이므로 복원하지 않음
  return {
    dockbox: deserializeBoxNode(serialized.dockbox, tabRegistry),
  };
}

function deserializeBoxNode(
  node: SerializedBoxNode,
  tabRegistry: Map<string, TabData>
): BoxNode {
  return {
    type: "box",
    id: node.id,
    mode: node.mode,
    sizes: [...node.sizes],
    children: node.children.map((child) =>
      child.type === "box"
        ? deserializeBoxNode(child, tabRegistry)
        : deserializePanelNode(child as SerializedPanelNode, tabRegistry)
    ),
  };
}

function deserializePanelNode(
  node: SerializedPanelNode,
  tabRegistry: Map<string, TabData>
): PanelNode {
  return {
    type: "panel",
    id: node.id,
    activeTabId: node.activeTabId,
    group: node.group,
    panelLock: node.panelLock,
    tabs: node.tabs.map((savedTab) => {
      const registered = tabRegistry.get(savedTab.id);
      return (
        registered ?? {
          id: savedTab.id,
          title: savedTab.title ?? savedTab.id,
          group: savedTab.group,
          data: savedTab.data,
        }
      );
    }),
  };
}

// ===== Migration from rc-dock format =====

/**
 * Attempt to migrate an rc-dock layout to the new format.
 * rc-dock format: { dockbox: { mode, children: [{ tabs: [{id}], size }] } }
 * Our format: { dockbox: { type: 'box', mode, children: [...], sizes: [...] } }
 */
export function migrateRcDockLayout(
  rcDockLayout: Record<string, unknown>
): SerializedLayout | null {
  try {
    const dockbox = rcDockLayout.dockbox as Record<string, unknown>;
    if (!dockbox) return null;
    return {
      dockbox: migrateRcDockNode(dockbox) as SerializedBoxNode,
    };
  } catch {
    return null;
  }
}

function migrateRcDockNode(
  node: Record<string, unknown>
): SerializedBoxNode | SerializedPanelNode {
  const children = node.children as Record<string, unknown>[] | undefined;
  const tabs = node.tabs as Record<string, unknown>[] | undefined;

  // If node has tabs, it's a panel node
  if (tabs && Array.isArray(tabs)) {
    return {
      type: "panel",
      id: (node.id as string) ?? `panel-migrated-${Math.random().toString(36).slice(2)}`,
      activeTabId: tabs[0]?.id as string ?? "",
      tabs: tabs.map((tab) => ({
        id: tab.id as string,
        group: tab.group as string | undefined,
      })),
      panelLock: node.panelLock as SerializedPanelNode["panelLock"],
    };
  }

  // If node has children, it's a box node
  if (children && Array.isArray(children)) {
    const mode = (node.mode as string) ?? "horizontal";
    const migratedChildren = children.map(migrateRcDockNode);
    // rc-dock stores size per child; we store sizes on parent
    const sizes = children.map((child) => (child.size as number) ?? 1);

    return {
      type: "box",
      id: (node.id as string) ?? `box-migrated-${Math.random().toString(36).slice(2)}`,
      mode: mode as "horizontal" | "vertical",
      children: migratedChildren,
      sizes,
    };
  }

  // Fallback: treat as empty panel
  return {
    type: "panel",
    id: `panel-migrated-${Math.random().toString(36).slice(2)}`,
    activeTabId: "",
    tabs: [],
  };
}
