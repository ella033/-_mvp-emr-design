"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { safeDocument } from "../common/util/ui-util";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "./my-tree-grid-type";
import type { ContextMenuAction } from "./my-tree-grid-interface";

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  header: MyTreeGridHeaderType | null;
  row: MyTreeGridRowType | null;
  selectedRows: MyTreeGridRowType[];
  actions?: ContextMenuAction[];
  onCloseAction: () => void;
}

export default function MyTreeContextMenu({
  visible,
  x,
  y,
  header,
  row,
  selectedRows,
  actions,
  onCloseAction,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

  // shortcuts 배열이 현재 키 이벤트와 일치하는지 확인
  const matchesShortcuts = (
    shortcuts: string[],
    e: KeyboardEvent
  ): boolean => {
    const normalizedShortcuts = shortcuts.map((s) => s.toLowerCase());

    // modifier 키 체크
    const requiresCtrl = normalizedShortcuts.includes("ctrl");
    const requiresCmd = normalizedShortcuts.includes("cmd");
    const requiresAlt = normalizedShortcuts.includes("alt");
    const requiresShift = normalizedShortcuts.includes("shift");

    // modifier 키가 일치하는지 확인
    if (requiresCtrl !== e.ctrlKey) return false;
    if (requiresCmd !== e.metaKey) return false;
    if (requiresAlt !== e.altKey) return false;
    if (requiresShift !== e.shiftKey) return false;

    // modifier가 아닌 일반 키 찾기
    const modifierKeys = ["ctrl", "cmd", "alt", "shift"];
    const regularKeys = normalizedShortcuts.filter(
      (s) => !modifierKeys.includes(s)
    );

    // 일반 키가 없으면 modifier만으로 판단
    if (regularKeys.length === 0) return true;

    // 눌린 키와 비교
    const pressedKey = e.key.toLowerCase();
    return regularKeys.includes(pressedKey);
  };

  useEffect(() => {
    if (!visible || !actions || !header || !row) return;

    const handleKeyDown = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;

      // Escape 키로 메뉴 닫기
      if (keyboardEvent.key === "Escape") {
        onCloseAction();
        return;
      }

      // 단축키 처리
      const matchingAction = actions.find((action) => {
        if (!action.shortcuts || action.shortcuts.length === 0) return false;

        // 단축키가 비활성화된 액션인지 확인
        if (action.disabled && action.disabled(header, row, selectedRows)) {
          return false;
        }

        return matchesShortcuts(action.shortcuts, keyboardEvent);
      });

      if (matchingAction) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopImmediatePropagation();
        matchingAction.onClick(header, row, selectedRows);
        onCloseAction();
      }
    };

    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseAction();
      }
    };

    safeDocument.addEventListener("mousedown", handleClickOutside);
    // 캡처 단계에서 등록하여 버블링 단계의 다른 리스너보다 먼저 실행
    safeDocument.addEventListener("keydown", handleKeyDown, true);

    return () => {
      safeDocument.removeEventListener("mousedown", handleClickOutside);
      safeDocument.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [visible, onCloseAction, actions, header, row, selectedRows]);

  // 위치 조정 로직
  useEffect(() => {
    if (!visible || !menuRef.current) return;

    const adjustPosition = () => {
      const menu = menuRef.current;
      if (!menu) return;

      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // 오른쪽 경계 체크
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10; // 10px 여백
      }

      // 왼쪽 경계 체크
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // 아래쪽 경계 체크
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10; // 10px 여백
      }

      // 위쪽 경계 체크
      if (adjustedY < 10) {
        adjustedY = 10;
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    };

    // DOM이 렌더링된 후 위치 조정
    const timeoutId = setTimeout(adjustPosition, 0);

    return () => clearTimeout(timeoutId);
  }, [visible, x, y]);

  if (!visible || !actions || !header || !row) return null;

  const enabledActions = actions.filter(
    (action) => !action.disabled || !action.disabled(header, row, selectedRows)
  );

  return createPortal(
    <div
      ref={menuRef}
      className="flex flex-col gap-0 context-menu fixed bg-[var(--card)] border border-[var(--border-1)] rounded-sm shadow-lg z-[9999] p-0 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {enabledActions.map((action) => (
        <button
          key={action.id}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-between"
          onClick={() => {
            action.onClick(header, row, selectedRows);
            onCloseAction();
          }}
        >
          <div className="flex items-center gap-2">
            {action.customRender ? (
              action.customRender
            ) : (
              <>
                {action.icon && action.icon}
                {action.label && <div>{action.label}</div>}
                {action.getLabel && (
                  <div>{action.getLabel(header, row, selectedRows)}</div>
                )}
              </>
            )}
          </div>
          {action.shortcuts && action.shortcuts.length > 0 && (
            <div className="text-xs text-gray-500 ml-2">
              {action.shortcuts.join("+")}
            </div>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
}
