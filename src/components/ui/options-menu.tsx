"use client";

import { useState, useRef, useEffect } from "react";

interface OptionsMenuItem {
  id: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

interface OptionsMenuProps {
  trigger: React.ReactNode;
  items: OptionsMenuItem[];
  className?: string;
  align?: 'left' | 'right';
  showAllToggle?: boolean;
  onAllToggle?: (checked: boolean) => void;
  allToggleLabel?: string;
}

export function OptionsMenu({
  trigger,
  items,
  className = "",
  align = 'right',
  showAllToggle = false,
  onAllToggle,
  allToggleLabel = "전체"
}: OptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  // 가장 긴 라벨의 길이를 계산하여 메뉴 너비 결정
  const calculateMenuWidth = () => {
    const allLabels = showAllToggle ? [allToggleLabel, ...items.map(item => item.label)] : items.map(item => item.label);
    const maxLabelLength = Math.max(...allLabels.map(label => label.length));
    // 한 글자당 약 10px + 체크박스와 패딩 고려하여 계산 - 다른 동적 계산법이 있다면 변경필요
    return Math.max(120, maxLabelLength * 10 + 60);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTriggerClick = (e: React.MouseEvent) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    setMenuPosition({
      top: rect.bottom,
      right: align === 'right' ? window.innerWidth - rect.right : window.innerWidth - rect.left
    });

    setIsOpen(!isOpen);
  };

  return (
    <div ref={triggerRef} className={`relative ${className}`}>
      <div onClick={handleTriggerClick}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className="fixed bg-[var(--background)] border rounded-md shadow-lg z-[9999]"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            width: `${calculateMenuWidth()}px`
          }}
        >
          {showAllToggle && onAllToggle && (
            <div className="p-0 border-b">
              <label className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={items.every(item => item.checked !== false)}
                  onChange={(e) => onAllToggle(e.target.checked)}
                />
                <span className="text-sm whitespace-nowrap">{allToggleLabel}</span>
              </label>
            </div>
          )}

          <div className="p-0">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={item.checked !== false}
                  onChange={(e) => item.onChange?.(e.target.checked)}
                />
                <span className="text-sm whitespace-nowrap">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 