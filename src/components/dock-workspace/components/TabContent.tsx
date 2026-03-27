"use client";

import React from "react";
import type { TabData, TabContentLoader } from "../types";

interface TabContentProps {
  tab: TabData;
  loadTab: TabContentLoader;
}

export const TabContent = React.memo(
  function TabContent({ tab, loadTab }: TabContentProps) {
    return <div className="dock-tab-content">{loadTab(tab)}</div>;
  },
  (prev, next) => prev.tab.id === next.tab.id && prev.loadTab === next.loadTab
);
