"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import MyRcDock, { type MyRcDockHandle } from "@/components/ui/my-rc-dock/my-rc-dock";
import "@/styles/rc-dock.css";
import "./medical-v2-dock.css";
import { DEFAULT_LAYOUT } from "./default-layouts";
import { getWidgetById, type WidgetDefinition } from "./widget-registry";

/* ─── 위젯 컴포넌트 lazy import ─── */
import CalendarPatientList from "../calendar-patient-list";
import PatientInfoPanel from "../patient-info-panel";
import DiagnosisPrescription from "../diagnosis-prescription";
import BundlePrescription from "../bundle-prescription";
import ClinicalMemoSymptoms from "../clinical-memo-symptoms";

/* ─── 플레이스홀더 위젯 ─── */
function PlaceholderWidget({ widget }: { widget: WidgetDefinition }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-[8px] text-[#989BA2] bg-white">
      <span className="text-[32px]">{widget.icon}</span>
      <span className="text-[13px] font-bold text-[#171719]">{widget.title}</span>
      <span className="text-[11px] text-[#989BA2]">{widget.description}</span>
      <span className="text-[10px] text-[#C2C4C8] mt-[4px]">준비 중</span>
    </div>
  );
}

/* ─── 임상메모 단독 위젯 (탭에서 분리) ─── */
function ClinicalMemoWidget() {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 p-[8px]">
        <textarea
          className="h-full w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8]"
          placeholder="임상메모를 입력하세요..."
          defaultValue={"고혈압 정기처방 3종\n위염약 2종\n\n혈액검사 (간기능, 신기능, 혈당)\n\n주기적인 고혈압 관찰 필요"}
        />
      </div>
    </div>
  );
}

function PatientMemoWidget() {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 p-[8px]">
        <textarea
          className="h-full w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8]"
          placeholder="환자메모를 입력하세요..."
        />
      </div>
    </div>
  );
}

function SymptomWidget() {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 p-[8px]">
        <textarea
          className="h-full w-full resize-none border-none bg-transparent text-[13px] leading-[1.6] text-[#171719] outline-none placeholder-[#C2C4C8]"
          placeholder="증상을 입력하세요..."
          defaultValue={"3일 전부터 목 아프고 기침 심함. 열감 있음. 콧물, 가래 동반."}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 레이아웃 유틸리티 (v1에서 이식)
 * ────────────────────────────────────────────── */
function collectTabIds(node: any): string[] {
  const ids: string[] = [];
  if (node?.tabs) { for (const tab of node.tabs) { if (tab?.id) ids.push(tab.id); } }
  if (node?.children) { for (const child of node.children) { ids.push(...collectTabIds(child)); } }
  if (node?.dockbox) ids.push(...collectTabIds(node.dockbox));
  if (node?.floatbox) ids.push(...collectTabIds(node.floatbox));
  return ids;
}

function findSiblingTabIds(node: any, tabId: string): string[] {
  if (node?.tabs) {
    const ids = node.tabs.map((t: any) => t?.id).filter(Boolean);
    if (ids.includes(tabId)) return ids.filter((id: string) => id !== tabId);
  }
  for (const child of node?.children ?? []) {
    const r = findSiblingTabIds(child, tabId);
    if (r.length > 0) return r;
  }
  if (node?.dockbox) { const r = findSiblingTabIds(node.dockbox, tabId); if (r.length > 0) return r; }
  return [];
}

function injectTabNextTo(node: any, targetTabId: string, newTab: { id: string }): boolean {
  if (node?.tabs) {
    if (node.tabs.some((t: any) => t?.id === targetTabId)) { node.tabs.push(newTab); return true; }
  }
  for (const child of node?.children ?? []) { if (injectTabNextTo(child, targetTabId, newTab)) return true; }
  if (node?.dockbox && injectTabNextTo(node.dockbox, targetTabId, newTab)) return true;
  if (node?.floatbox && injectTabNextTo(node.floatbox, targetTabId, newTab)) return true;
  return false;
}

function injectTabToFirstPanel(node: any, newTab: { id: string }): boolean {
  if (node?.dockbox) return injectTabToFirstPanel(node.dockbox, newTab);
  if (node?.tabs) { node.tabs.push(newTab); return true; }
  for (const child of node?.children ?? []) { if (injectTabToFirstPanel(child, newTab)) return true; }
  return false;
}

function mergeNewTabs(savedLayout: any, defaultLayout: any): any {
  const savedIds = new Set(collectTabIds(savedLayout));
  const defaultIds = collectTabIds(defaultLayout);
  const missingIds = defaultIds.filter((id) => !savedIds.has(id));
  if (missingIds.length === 0) return savedLayout;
  const merged = JSON.parse(JSON.stringify(savedLayout));
  for (const missingId of missingIds) {
    const siblings = findSiblingTabIds(defaultLayout, missingId);
    let injected = false;
    for (const sibId of siblings) {
      if (savedIds.has(sibId) && injectTabNextTo(merged, sibId, { id: missingId })) { injected = true; break; }
    }
    if (!injected) injectTabToFirstPanel(merged, { id: missingId });
  }
  return merged;
}

function stripRemovedTabs(savedLayout: any, defaultLayout: any): any {
  const validIds = new Set(collectTabIds(defaultLayout));
  const cleaned = JSON.parse(JSON.stringify(savedLayout));
  function cleanNode(node: any) {
    if (node?.tabs) {
      node.tabs = node.tabs.filter((t: any) => t?.id && validIds.has(t.id));
      if (node.activeId && !validIds.has(node.activeId)) node.activeId = node.tabs[0]?.id;
    }
    if (node?.children) {
      node.children = node.children.filter((child: any) => {
        cleanNode(child);
        return (child.tabs && child.tabs.length > 0) || (child.children && child.children.length > 0);
      });
    }
    if (node?.dockbox) cleanNode(node.dockbox);
    if (node?.floatbox) cleanNode(node.floatbox);
    if (node?.windowbox) cleanNode(node.windowbox);
  }
  cleanNode(cleaned);
  return cleaned;
}

function stripWindowboxForSave(layout: any, defaultLayout: any): any {
  if (!layout?.windowbox?.children?.length) return layout;
  const cleaned = JSON.parse(JSON.stringify(layout));
  const windowTabIds: string[] = [];
  for (const panel of cleaned.windowbox.children) {
    if (panel?.tabs) { for (const tab of panel.tabs) { if (tab?.id) windowTabIds.push(tab.id); } }
  }
  cleaned.windowbox = { mode: "window", children: [] };
  for (const tabId of windowTabIds) {
    const siblings = findSiblingTabIds(defaultLayout, tabId);
    let injected = false;
    for (const sibId of siblings) { if (injectTabNextTo(cleaned, sibId, { id: tabId })) { injected = true; break; } }
    if (!injected) injectTabToFirstPanel(cleaned, { id: tabId });
  }
  return cleaned;
}

/* ──────────────────────────────────────────────
 * 메인 DockableLayout 컴포넌트
 * ────────────────────────────────────────────── */
interface DockableLayoutProps {
  isEditMode: boolean;
  onLayoutChange?: () => void;
}

export default function DockableLayout({ isEditMode, onLayoutChange }: DockableLayoutProps) {
  const dockRef = useRef<MyRcDockHandle>(null);
  const [mounted, setMounted] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedHashRef = useRef<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  /* ─── loadTab: 위젯 ID → React 컴포넌트 매핑 ─── */
  const loadTab = useCallback((savedTab: any) => {
    if (!savedTab) return null;
    const id = typeof savedTab === "object" ? savedTab.id : savedTab;
    const baseTab = { group: "default" };

    switch (id) {
      case "calendar-patients":
        return { ...baseTab, id, title: "진료 일정", content: <CalendarPatientList /> };
      case "patient-info":
        return { ...baseTab, id, title: "환자 정보", content: <PatientInfoPanel /> };
      case "diagnosis-prescription":
        return { ...baseTab, id, title: "진단 및 처방", content: <DiagnosisPrescription /> };
      case "bundle-prescription":
        return { ...baseTab, id, title: "묶음처방", content: <BundlePrescription /> };
      case "clinical-memo":
        return { ...baseTab, id, title: "임상메모", content: <ClinicalMemoWidget /> };
      case "patient-memo":
        return { ...baseTab, id, title: "환자메모", content: <PatientMemoWidget /> };
      case "symptom":
        return { ...baseTab, id, title: "증상", content: <SymptomWidget /> };
      default: {
        const widget = getWidgetById(id);
        if (widget) {
          return { ...baseTab, id, title: widget.title, content: <PlaceholderWidget widget={widget} /> };
        }
        return null;
      }
    }
  }, []);

  const saveTab = useCallback((tabData: any) => {
    const saved: any = { id: tabData?.id || "unknown" };
    if (tabData?.group) saved.group = tabData.group;
    return saved;
  }, []);

  /* ─── 레이아웃 변경 핸들러 (debounce, localStorage 저장) ─── */
  const handleLayoutChange = useCallback((newLayout: any) => {
    if (!newLayout) return;
    let hash: string | null = null;
    try { hash = JSON.stringify(newLayout); } catch { hash = null; }
    if (hash && hash === lastSavedHashRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const toSave = stripWindowboxForSave(newLayout, DEFAULT_LAYOUT);
      try {
        localStorage.setItem("medical-v2-layout", JSON.stringify(toSave));
        lastSavedHashRef.current = JSON.stringify(toSave);
      } catch { /* ignore */ }
      onLayoutChange?.();
    }, 500);
  }, [onLayoutChange]);

  /* ─── 저장된 레이아웃 복원 ─── */
  const initialLayout = useMemo(() => {
    try {
      const saved = localStorage.getItem("medical-v2-layout");
      if (saved) {
        const parsed = JSON.parse(saved);
        const stripped = stripRemovedTabs(parsed, DEFAULT_LAYOUT);
        return mergeNewTabs(stripped, DEFAULT_LAYOUT);
      }
    } catch { /* ignore */ }
    return DEFAULT_LAYOUT;
  }, []);

  /* ─── 그룹 설정 ─── */
  const groups = useMemo(() => ({
    default: {
      floatable: isEditMode,
      tabLocked: !isEditMode,
      animated: true,
    },
  }), [isEditMode]);

  /* ─── 레이아웃 초기화 ─── */
  const resetLayout = useCallback(() => {
    localStorage.removeItem("medical-v2-layout");
    lastSavedHashRef.current = null;
    dockRef.current?.loadLayout(DEFAULT_LAYOUT);
  }, []);

  /* ─── 템플릿 적용 ─── */
  const applyTemplate = useCallback((layout: any) => {
    try {
      localStorage.setItem("medical-v2-layout", JSON.stringify(layout));
      lastSavedHashRef.current = JSON.stringify(layout);
    } catch { /* ignore */ }
    dockRef.current?.loadLayout(layout);
  }, []);

  /* ─── 위젯 추가 ─── */
  const addWidget = useCallback((widgetId: string) => {
    if (!dockRef.current) return;
    const currentLayout = dockRef.current.saveLayout();
    if (!currentLayout) return;

    const existingIds = collectTabIds(currentLayout);
    if (existingIds.includes(widgetId)) return; // 이미 존재

    const layoutCopy = JSON.parse(JSON.stringify(currentLayout));
    injectTabToFirstPanel(layoutCopy, { id: widgetId });
    dockRef.current.loadLayout(layoutCopy);
  }, []);

  /* ─── 위젯 제거 ─── */
  const removeWidget = useCallback((widgetId: string) => {
    if (!dockRef.current) return;
    const tab = dockRef.current.find(widgetId);
    if (tab) {
      const dl = dockRef.current.getDockLayout();
      if (dl) dl.dockMove(tab, null, "remove");
    }
  }, []);

  // Expose methods via ref-like pattern (store or context)
  useEffect(() => {
    (window as any).__medicalV2Dock = { resetLayout, applyTemplate, addWidget, removeWidget, getDockRef: () => dockRef.current };
    return () => { delete (window as any).__medicalV2Dock; };
  }, [resetLayout, applyTemplate, addWidget, removeWidget]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!mounted) return <div className="flex-1 bg-[#F5F5F5]" />;

  return (
    <div className={`flex-1 min-h-0 medical-v2-dock ${isEditMode ? "edit-mode" : ""}`}>
      <MyRcDock
        ref={dockRef}
        defaultLayout={initialLayout}
        saveTab={saveTab}
        loadTab={loadTab as any}
        groups={groups}
        onLayoutChange={handleLayoutChange}
      />
    </div>
  );
}
