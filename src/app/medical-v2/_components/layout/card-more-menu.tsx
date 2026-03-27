"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, EyeOff } from "lucide-react";
import { useEditMode } from "./edit-mode-context";

interface CardMoreMenuProps {
  widgetId: string;
  children?: React.ReactNode; // 기존 메뉴 항목
}

/**
 * 카드 모듈 삼점 메뉴
 * - 편집 모드일 때: "위젯 숨기기" 옵션 추가
 * - 기본 모드: children으로 전달된 기존 메뉴 표시
 */
export default function CardMoreMenu({ widgetId, children }: CardMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isEditMode, onHideWidget } = useEditMode();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-[2px] text-[#70737C] hover:text-[#171719]"
        onClick={() => setOpen(!open)}
      >
        <MoreVertical className="h-[14px] w-[14px]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[24px] z-50 min-w-[120px] rounded-[6px] border border-[#EAEBEC] bg-white py-[2px] shadow-lg">
          {/* 편집 모드: 위젯 숨기기 */}
          {isEditMode && (
            <button
              className="flex w-full items-center gap-[6px] px-[10px] py-[6px] text-[12px] text-[#FF4242] hover:bg-[#FEECEC]"
              onClick={() => { onHideWidget(widgetId); setOpen(false); }}
            >
              <EyeOff className="h-[12px] w-[12px]" />
              위젯 숨기기
            </button>
          )}

          {/* 기존 메뉴 항목 */}
          {children}
        </div>
      )}
    </div>
  );
}
