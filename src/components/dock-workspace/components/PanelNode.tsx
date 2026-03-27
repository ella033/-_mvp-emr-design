"use client";

import React, { useRef, useCallback } from "react";
import type { PanelNode } from "../types";
import { TabBar } from "./TabBar";
import { TabContent } from "./TabContent";
import { useDockWorkspaceContext, useDockStore } from "./DockWorkspace";

interface PanelNodeProps {
  node: PanelNode;
}

export const PanelNodeComponent = React.memo(function PanelNodeComponent({
  node,
}: PanelNodeProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { onPanelFocus, loadTab, panelExtra, panelExtraLeft } = useDockWorkspaceContext();

  const setActiveTab = useDockStore((s) => s.setActiveTab);

  const activeTab = node.tabs.find((t) => t.id === node.activeTabId) ?? node.tabs[0];

  const handleTabSelect = useCallback(
    (tabId: string) => {
      setActiveTab(node.id, tabId);
    },
    [node.id, setActiveTab]
  );

  const handleFocus = useCallback(() => {
    onPanelFocus?.(node.id);
  }, [node.id, onPanelFocus]);

  return (
    <div
      ref={panelRef}
      className="dock-panel"
      data-panel-id={node.id}
      onFocus={handleFocus}
      tabIndex={-1}
    >
      <TabBar
        tabs={node.tabs}
        activeTabId={activeTab?.id ?? ""}
        panelId={node.id}
        onTabSelect={handleTabSelect}
        panelExtra={panelExtra}
        panelExtraLeft={panelExtraLeft}
        activeTab={activeTab}
        panelLock={node.panelLock}
      />
      <div className="dock-panel-content">
        {node.tabs.map((tab) => (
          <div
            key={tab.id}
            className="dock-tab-content"
            style={{ display: tab.id === activeTab?.id ? undefined : "none" }}
          >
            <TabContent tab={tab} loadTab={loadTab} />
          </div>
        ))}
      </div>
    </div>
  );
});
