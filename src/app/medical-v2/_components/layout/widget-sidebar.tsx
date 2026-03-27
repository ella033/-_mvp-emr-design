"use client";

import React from "react";
import { X, Plus, Check } from "lucide-react";
import { getWidgetsByCategory, type WidgetCategory } from "./widget-registry";

const CATEGORY_ORDER: WidgetCategory[] = ["진료", "참고", "AI", "운영", "수납"];

interface WidgetSidebarProps {
  onClose: () => void;
  onAddWidget: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
  activeWidgetIds: string[];
}

export default function WidgetSidebar({ onClose, onAddWidget, onRemoveWidget, activeWidgetIds }: WidgetSidebarProps) {
  const grouped = getWidgetsByCategory();

  return (
    <div className="fixed right-0 top-0 bottom-0 z-[80] w-[280px] bg-white border-l border-[#C2C4C8] shadow-xl flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-[14px] py-[10px] border-b border-[#EAEBEC] shrink-0">
        <span className="text-[13px] font-bold text-[#171719]">위젯 추가</span>
        <button onClick={onClose} className="p-[2px] text-[#989BA2] hover:text-[#171719]">
          <X className="h-[16px] w-[16px]" />
        </button>
      </div>

      {/* 위젯 목록 */}
      <div className="flex-1 overflow-y-auto py-[8px]">
        {CATEGORY_ORDER.map((cat) => {
          const widgets = grouped[cat];
          if (!widgets?.length) return null;

          return (
            <div key={cat} className="mb-[12px]">
              <div className="px-[14px] py-[4px]">
                <span className="text-[10px] font-bold text-[#989BA2] uppercase tracking-wider">{cat}</span>
              </div>
              {widgets.map((w) => {
                const isActive = activeWidgetIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    className={`flex items-center gap-[10px] px-[14px] py-[8px] cursor-pointer group transition-colors ${
                      isActive ? "bg-[#F1EDFF]" : "hover:bg-[#F8F8FA]"
                    }`}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-[12px] font-bold ${isActive ? "text-[#453EDC]" : "text-[#171719]"}`}>{w.title}</span>
                      <span className="text-[10px] text-[#989BA2] truncate">{w.description}</span>
                    </div>
                    {isActive ? (
                      <button
                        className="shrink-0 p-[3px] rounded-[4px] text-[#FF4242] hover:bg-[#FEECEC] transition-colors"
                        onClick={() => onRemoveWidget(w.id)}
                        title={`${w.title} 제거`}
                      >
                        <X className="h-[14px] w-[14px]" />
                      </button>
                    ) : (
                      <button
                        className="shrink-0 p-[3px] rounded-[4px] text-[#C2C4C8] group-hover:text-[#453EDC] group-hover:bg-[#F1EDFF] transition-colors"
                        onClick={() => onAddWidget(w.id)}
                        title={`${w.title} 추가`}
                      >
                        <Plus className="h-[14px] w-[14px]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
