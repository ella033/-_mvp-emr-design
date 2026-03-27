"use client";

import { createPortal } from "react-dom";
import { CommandList } from "./command-list";
import type { CommandItem } from "./slash-command-extension";
import { forwardRef, useRef, useState, useLayoutEffect } from "react";

interface TextareaSlashCommandPopupProps {
  isOpen: boolean;
  position: { top: number; left: number };
  items: CommandItem[];
  onSelect: (item: CommandItem) => void;
}

const TextareaSlashCommandPopup = forwardRef<
  any,
  TextareaSlashCommandPopupProps
>(({ isOpen, position, items, onSelect }, ref) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useLayoutEffect(() => {
    if (!isOpen || !popupRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const popup = popupRef.current;
    const popupRect = popup.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let newTop = position.top;
    let newLeft = position.left;

    // 하단이 화면 밖으로 나가면 위쪽에 표시
    if (position.top + popupRect.height > viewportHeight) {
      // 슬래시 위에 표시 (약 36px 정도 위로 올림 - 한 줄 높이 + 팝업 높이)
      newTop = position.top - popupRect.height - 36;
    }

    // 우측이 화면 밖으로 나가면 좌측으로 이동
    if (position.left + popupRect.width > viewportWidth) {
      newLeft = viewportWidth - popupRect.width - 8;
    }

    // 좌측이 화면 밖으로 나가면 0으로 설정
    if (newLeft < 0) {
      newLeft = 8;
    }

    // 상단이 화면 밖으로 나가면 아래로 다시 설정
    if (newTop < 0) {
      newTop = position.top;
    }

    setAdjustedPosition({ top: newTop, left: newLeft });
  }, [isOpen, position, items]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="slash-command-popup fixed z-[9999]"
      style={{
        top: adjustedPosition.top,
        left: adjustedPosition.left,
      }}
    >
      <CommandList ref={ref} items={items} command={onSelect} />
    </div>,
    document.body
  );
});

TextareaSlashCommandPopup.displayName = "TextareaSlashCommandPopup";

export { TextareaSlashCommandPopup };

