"use client";

import React, { useState, useCallback, useMemo } from "react";
import CollapsedSidebar from "./_components/collapsed-sidebar";
import HeaderBar from "./_components/header-bar";
import CalendarPatientList from "./_components/calendar-patient-list";
import PatientInfoPanel from "./_components/patient-info-panel";
import DiagnosisPrescription from "./_components/diagnosis-prescription";
import BundlePrescription from "./_components/bundle-prescription";
import ClinicalMemoSymptoms from "./_components/clinical-memo-symptoms";
import ImageViewerPanel from "./_components/image-viewer-panel";
import LayoutEditBar from "./_components/layout/layout-edit-bar";
import { WIDGET_DEFINITIONS, DEFAULT_ACTIVE_WIDGET_IDS, type WidgetDefinition } from "./_components/layout/widget-registry";
import { EditModeProvider } from "./_components/layout/edit-mode-context";
import ResizablePanel from "./_components/layout/resizable-panel";
import { DraggableLayout, SortableCard } from "./_components/layout/draggable-layout";
import SplitLayout from "./_components/layout/split-layout";

/* ── 위젯별 기본 사이즈 설정 (비율 기반, 합계 ~100) ── */
const WIDGET_SIZES: Record<string, { default: number; min: number; max: number }> = {
  "calendar-patients": { default: 14, min: 220, max: 360 },
  "patient-info": { default: 20, min: 300, max: 500 },
  "diagnosis-prescription": { default: 28, min: 400, max: 1200 },
  "bundle-prescription": { default: 18, min: 280, max: 600 },
  "clinical-memo": { default: 20, min: 220, max: 500 },
  "patient-memo": { default: 20, min: 220, max: 500 },
  "symptom": { default: 20, min: 220, max: 500 },
  "image-viewer": { default: 22, min: 280, max: 600 },
};
const DEFAULT_SIZE = { default: 16, min: 220, max: 500 };

/* ── 메모 그룹 ID ── */
const MEMO_GROUP_IDS = new Set(["clinical-memo", "patient-memo", "symptom"]);
const MEMO_SLOT_ID = "__memo_group__";

function extractWidgetIds(layout: any): string[] {
  const ids: string[] = [];
  function walk(node: any) {
    if (node?.tabs) node.tabs.forEach((t: any) => { if (t?.id) ids.push(t.id); });
    if (node?.children) node.children.forEach(walk);
    if (node?.dockbox) walk(node.dockbox);
  }
  walk(layout);
  return ids;
}

function PlaceholderWidget({ widget }: { widget: WidgetDefinition }) {
  return (
    <div className="flex w-full h-full flex-col rounded-[6px] border border-[#C2C4C8] bg-white overflow-hidden">
      <div className="flex h-[32px] items-center bg-[#E8ECF6] px-[12px] shrink-0">
        <span className="text-[13px] font-bold text-[#171719]">{widget.title}</span>
      </div>
      <div className="flex flex-1 items-center justify-center p-[16px]">
        <div className="flex flex-col items-center gap-[6px] text-center">
          <span className="text-[12px] font-bold text-[#171719]">{widget.title}</span>
          <span className="text-[11px] text-[#989BA2]">{widget.description}</span>
          <span className="text-[10px] text-[#C2C4C8]">준비 중</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
 * 메인 페이지
 * ────────────────────────────────────────────── */
export default function MedicalV2Page() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>([...DEFAULT_ACTIVE_WIDGET_IDS]);
  const [savedWidgetIds, setSavedWidgetIds] = useState<string[]>([...DEFAULT_ACTIVE_WIDGET_IDS]);

  const handleEnterEditMode = useCallback(() => {
    setSavedWidgetIds([...activeWidgetIds]);
    setIsEditMode(true);
  }, [activeWidgetIds]);

  const handleReset = useCallback(() => setActiveWidgetIds([...DEFAULT_ACTIVE_WIDGET_IDS]), []);
  const handleSave = useCallback(() => { setSavedWidgetIds([...activeWidgetIds]); setIsEditMode(false); }, [activeWidgetIds]);
  const handleCancel = useCallback(() => { setActiveWidgetIds([...savedWidgetIds]); setIsEditMode(false); }, [savedWidgetIds]);
  const handleAddWidget = useCallback((id: string) => setActiveWidgetIds((p) => p.includes(id) ? p : [...p, id]), []);
  const handleRemoveWidget = useCallback((id: string) => setActiveWidgetIds((p) => p.filter((x) => x !== id)), []);
  const handleApplyTemplate = useCallback((layout: any) => { const ids = extractWidgetIds(layout); if (ids.length > 0) setActiveWidgetIds(ids); }, []);

  /* 렌더링할 슬롯 목록 (메모 그룹은 하나로 합침) */
  const slots = useMemo(() => {
    const result: string[] = [];
    let memoAdded = false;
    for (const id of activeWidgetIds) {
      if (MEMO_GROUP_IDS.has(id)) {
        if (!memoAdded) { result.push(MEMO_SLOT_ID); memoAdded = true; }
      } else {
        result.push(id);
      }
    }
    return result;
  }, [activeWidgetIds]);

  const handleReorder = useCallback((newSlots: string[]) => {
    // 슬롯 순서를 activeWidgetIds 순서로 변환
    const newIds: string[] = [];
    for (const slot of newSlots) {
      if (slot === MEMO_SLOT_ID) {
        // 메모 그룹 원래 순서 유지
        for (const id of activeWidgetIds) { if (MEMO_GROUP_IDS.has(id)) newIds.push(id); }
      } else {
        newIds.push(slot);
      }
    }
    setActiveWidgetIds(newIds);
  }, [activeWidgetIds]);

  const hasMemoGroup = activeWidgetIds.some((id) => MEMO_GROUP_IDS.has(id));

  /* 위젯 컨텐츠 렌더링 */
  function renderContent(slotId: string): React.ReactNode {
    if (slotId === MEMO_SLOT_ID) return <ClinicalMemoSymptoms />;
    switch (slotId) {
      case "calendar-patients": return <CalendarPatientList />;
      case "patient-info": return <PatientInfoPanel />;
      case "diagnosis-prescription": return <DiagnosisPrescription />;
      case "bundle-prescription": return <BundlePrescription />;
      case "image-viewer": return <ImageViewerPanel />;
      default: {
        const widget = WIDGET_DEFINITIONS.find((w) => w.id === slotId);
        return widget ? <PlaceholderWidget widget={widget} /> : null;
      }
    }
  }

  /* 각 슬롯의 기본 비율과 최소 너비 */
  const slotRatios = slots.map((s) => {
    const key = s === MEMO_SLOT_ID ? "clinical-memo" : s;
    return (WIDGET_SIZES[key] || DEFAULT_SIZE).default;
  });
  const slotMinWidths = slots.map((s) => {
    const key = s === MEMO_SLOT_ID ? "clinical-memo" : s;
    return (WIDGET_SIZES[key] || DEFAULT_SIZE).min;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f5f5]">
      <CollapsedSidebar />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <HeaderBar onEnterEditMode={handleEnterEditMode} />

        {isEditMode && (
          <LayoutEditBar
            onReset={handleReset}
            onSave={handleSave}
            onCancel={handleCancel}
            onAddWidget={handleAddWidget}
            onRemoveWidget={handleRemoveWidget}
            onApplyTemplate={handleApplyTemplate}
            activeWidgetIds={activeWidgetIds}
          />
        )}

        <EditModeProvider isEditMode={isEditMode} onHideWidget={handleRemoveWidget}>
          <div className="flex flex-1 p-[6px] min-h-0 overflow-hidden">
            {isEditMode ? (
              /* 편집 모드: 드래그로 순서 변경 */
              <DraggableLayout items={slots} onReorder={handleReorder} isEditMode={isEditMode}>
                {slots.map((slotId) => (
                  <SortableCard key={slotId} id={slotId} isEditMode={isEditMode}>
                    <div className="h-full">{renderContent(slotId)}</div>
                  </SortableCard>
                ))}
              </DraggableLayout>
            ) : (
              /* 기본 모드: 스플리터로 양쪽 동시 리사이즈 */
              <SplitLayout defaultRatios={slotRatios} minWidths={slotMinWidths} gap={6}>
                {slots.map((slotId) => (
                  <div key={slotId} className="h-full">{renderContent(slotId)}</div>
                ))}
              </SplitLayout>
            )}
          </div>
        </EditModeProvider>
      </div>
    </div>
  );
}
