"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { DEPARTMENT_TEMPLATES, type LayoutTemplate } from "./default-layouts";

interface TemplateModalProps {
  onClose: () => void;
  onApply: (layout: any) => void;
}

export default function TemplateModal({ onClose, onApply }: TemplateModalProps) {
  const [selected, setSelected] = useState<LayoutTemplate>(DEPARTMENT_TEMPLATES[0]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-[640px] max-h-[80vh] rounded-[8px] bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[#EAEBEC]">
          <div>
            <h2 className="text-[15px] font-bold text-[#171719]">진료과 템플릿 선택</h2>
            <p className="text-[12px] text-[#989BA2] mt-[2px]">진료과별 최적화된 위젯 구성을 선택하세요</p>
          </div>
          <button onClick={onClose} className="p-[4px] text-[#989BA2] hover:text-[#171719]">
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 왼쪽: 진료과 목록 */}
          <div className="w-[200px] border-r border-[#EAEBEC] overflow-y-auto py-[4px]">
            {DEPARTMENT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`flex w-full items-center gap-[8px] px-[14px] py-[10px] text-left transition-colors ${
                  selected.id === tpl.id ? "bg-[#F1EDFF] text-[#453EDC] font-bold" : "text-[#46474C] hover:bg-[#F8F8FA]"
                }`}
                onClick={() => setSelected(tpl)}
              >
                <span className="text-[18px]">{tpl.icon}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-bold">{tpl.name}</span>
                  <span className="text-[10px] text-[#989BA2] truncate">{tpl.description}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 오른쪽: 선택된 템플릿 미리보기 */}
          <div className="flex-1 flex flex-col p-[16px]">
            <div className="flex items-center gap-[6px] mb-[12px]">
              <span className="text-[18px]">{selected.icon}</span>
              <span className="text-[14px] font-bold text-[#171719]">{selected.name}</span>
              <span className="text-[12px] text-[#989BA2]">{selected.description}</span>
            </div>

            {/* 레이아웃 프리뷰 (미니어처) */}
            <div className="flex-1 rounded-[6px] border border-[#EAEBEC] bg-[#F7F7F8] p-[12px] mb-[12px]">
              <LayoutPreview layout={selected.layout} />
            </div>

            {/* 위젯 태그 */}
            <div className="flex flex-wrap gap-[4px]">
              {selected.widgetIds.map((wid) => (
                <span key={wid} className="rounded-[4px] bg-[#F1EDFF] px-[6px] py-[2px] text-[10px] text-[#453EDC] font-medium">
                  {wid.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-end gap-[8px] px-[20px] py-[12px] border-t border-[#EAEBEC]">
          <button onClick={onClose} className="rounded-[6px] border border-[#C2C4C8] px-[16px] py-[6px] text-[12px] text-[#70737C]">
            취소
          </button>
          <button
            className="flex items-center gap-[4px] rounded-[6px] bg-[#453EDC] px-[16px] py-[6px] text-[12px] font-bold text-white hover:bg-[#3730B0]"
            onClick={() => onApply(selected.layout)}
          >
            <Check className="h-[12px] w-[12px]" />
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

/** 레이아웃 미니어처 프리뷰 */
function LayoutPreview({ layout }: { layout: any }) {
  if (!layout?.dockbox) return null;

  return (
    <div className="flex h-full gap-[4px]">
      {layout.dockbox.children?.map((child: any, idx: number) => (
        <PreviewNode key={idx} node={child} />
      ))}
    </div>
  );
}

function PreviewNode({ node }: { node: any }) {
  const size = node.size || 25;

  if (node.mode === "vertical" && node.children) {
    return (
      <div className="flex flex-col gap-[4px]" style={{ flex: size }}>
        {node.children.map((child: any, idx: number) => (
          <PreviewNode key={idx} node={child} />
        ))}
      </div>
    );
  }

  if (node.mode === "horizontal" && node.children) {
    return (
      <div className="flex gap-[4px]" style={{ flex: size }}>
        {node.children.map((child: any, idx: number) => (
          <PreviewNode key={idx} node={child} />
        ))}
      </div>
    );
  }

  // 탭 패널
  const tabs = node.tabs || [];
  return (
    <div
      className="flex flex-col rounded-[4px] bg-white border border-[#EAEBEC] overflow-hidden"
      style={{ flex: node.size || 25 }}
    >
      <div className="flex items-center gap-[2px] px-[4px] py-[2px] bg-[#E8ECF6] shrink-0">
        {tabs.map((tab: any, i: number) => (
          <span key={i} className="text-[7px] text-[#46474C] px-[3px] py-[1px] rounded-[2px] bg-white/60 truncate max-w-[60px]">
            {tab.id?.replace(/-/g, " ")}
          </span>
        ))}
      </div>
      <div className="flex-1" />
    </div>
  );
}
