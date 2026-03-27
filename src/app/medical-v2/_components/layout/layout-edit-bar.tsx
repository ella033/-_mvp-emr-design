"use client";

import React, { useState } from "react";
import { RotateCcw, X, Check, LayoutTemplate, Plus } from "lucide-react";
import WidgetSidebar from "./widget-sidebar";
import TemplateModal from "./template-modal";

interface LayoutEditBarProps {
  onReset: () => void;
  onSave: () => void;
  onCancel: () => void;
  onAddWidget: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
  onApplyTemplate: (layout: any) => void;
  activeWidgetIds: string[];
}

export default function LayoutEditBar({
  onReset, onSave, onCancel, onAddWidget, onRemoveWidget, onApplyTemplate, activeWidgetIds,
}: LayoutEditBarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  return (
    <>
      {/* 편집 바 */}
      <div className="flex h-[32px] items-center bg-[#7C5CFA] px-[12px] shrink-0 gap-[8px]">
        <span className="text-[12px] font-bold text-white">• 레이아웃 편집 중</span>

        <div className="flex items-center gap-[4px] ml-auto">
          <button
            className="flex items-center gap-[4px] rounded-[4px] px-[8px] py-[3px] text-[11px] font-bold text-white bg-white/20 hover:bg-white/30"
            onClick={() => setTemplateOpen(true)}
          >
            <LayoutTemplate className="h-[12px] w-[12px]" />
            템플릿
          </button>
          <button
            className="flex items-center gap-[4px] rounded-[4px] px-[8px] py-[3px] text-[11px] font-bold text-white bg-white/20 hover:bg-white/30"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Plus className="h-[12px] w-[12px]" />
            위젯 추가 {activeWidgetIds.length}
          </button>

          <div className="w-px h-[16px] bg-white/30 mx-[4px]" />

          <button className="flex items-center gap-[4px] rounded-[4px] px-[8px] py-[3px] text-[11px] text-white/80 hover:text-white hover:bg-white/10" onClick={onReset}>
            <RotateCcw className="h-[12px] w-[12px]" />
            초기화
          </button>
          <button className="rounded-[4px] px-[8px] py-[3px] text-[11px] text-white/80 hover:text-white hover:bg-white/10" onClick={onCancel}>
            취소
          </button>
          <button className="flex items-center gap-[4px] rounded-[4px] px-[8px] py-[3px] text-[11px] font-bold text-[#7C5CFA] bg-white hover:bg-[#F1EDFF]" onClick={onSave}>
            <Check className="h-[12px] w-[12px]" />
            저장
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <WidgetSidebar
          onClose={() => setSidebarOpen(false)}
          onAddWidget={onAddWidget}
          onRemoveWidget={onRemoveWidget}
          activeWidgetIds={activeWidgetIds}
        />
      )}

      {templateOpen && (
        <TemplateModal
          onClose={() => setTemplateOpen(false)}
          onApply={(layout) => { onApplyTemplate(layout); setTemplateOpen(false); }}
        />
      )}
    </>
  );
}
