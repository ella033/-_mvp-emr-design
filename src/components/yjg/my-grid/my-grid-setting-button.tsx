import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { FilterIcon } from "@/components/custom-icons";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MyButton } from "../my-button";

interface MyGridSettingButtonProps {
  title?: string;
  defaultHeaders: MyGridHeaderType[];
  headers: MyGridHeaderType[];
  setHeaders: (headers: MyGridHeaderType[]) => void;
}

export const MyGridSettingButton = ({
  title = "컬럼 설정",
  defaultHeaders,
  headers,
  setHeaders,
}: MyGridSettingButtonProps) => {
  const [isColumnSettingOpen, setIsColumnSettingOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsColumnSettingOpen(false);
      }
    };

    if (isColumnSettingOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnSettingOpen]);

  const renderDropdown = () => {
    if (!isColumnSettingOpen || !buttonRef.current) return null;

    const buttonRect = buttonRef.current.getBoundingClientRect();

    return createPortal(
      <div
        ref={menuRef}
        className="fixed bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg z-[9999] flex flex-col my-scroll p-[5px] w-fit max-h-[30vh]"
        style={{
          top: buttonRect.bottom + 1,
          right: window.innerWidth - buttonRect.right,
        }}
        onMouseEnter={(e) => {
          // 드롭다운이 렌더링된 후 실제 너비를 측정하여 위치 조정
          const dropdownRect = e.currentTarget.getBoundingClientRect();
          const isOverflowing = dropdownRect.left < 0;

          if (isOverflowing) {
            e.currentTarget.style.right = "auto";
            e.currentTarget.style.left = `${buttonRect.left}px`;
          }
        }}
      >
        <button
          className="w-full px-[5px] py-[5px] text-left hover:bg-[var(--bg-tertiary)] items-center gap-[5px] whitespace-nowrap text-[14px]"
          onClick={() => {
            setHeaders(defaultHeaders.map((h) => ({ ...h, visible: true })));
          }}
        >
          기본설정 복원
        </button>
        <div className="border-t border-gray-300 dark:border-gray-600 my-[5px]"></div>
        {headers.map((header) => (
          <label
            className="flex items-center gap-[5px] px-[5px] py-[5px] hover:bg-[var(--bg-tertiary)] cursor-pointer whitespace-nowrap"
            key={header.key}
          >
            <input
              type="checkbox"
              checked={header.visible}
              onChange={(e) => {
                setHeaders(
                  headers.map((h) => ({
                    ...h,
                    visible:
                      h.key === header.key ? e.target.checked : h.visible,
                  }))
                );
              }}
            />
            <span className="text-[14px]">{header.name}</span>
          </label>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className="relative">
      <MyTooltip
        side="left"
        align="start"
        content={<div className="text-center text-[14px]">{title}</div>}
      >
        <MyButton
          variant="ghost"
          size="icon"
          className="p-1"
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsColumnSettingOpen(!isColumnSettingOpen);
          }}
        >
          <FilterIcon className="w-[16px] h-[16px]" />
        </MyButton>
      </MyTooltip>
      {renderDropdown()}
    </div>
  );
};
