import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MyButton } from "../my-button";
import { FilterIcon } from "@/components/custom-icons";

interface MyTreeGridSettingButtonProps {
  title?: string;
  defaultHeaders: MyTreeGridHeaderType[];
  headers: MyTreeGridHeaderType[];
  setHeaders: (headers: MyTreeGridHeaderType[]) => void;
  /** true이면 드롭다운에 "아이콘 보이기" 옵션 표시 */
  showRowIconSetting?: boolean;
  /** 행 아이콘(지시 버튼 등) 표시 여부 */
  showRowIcon?: boolean;
  /** 아이콘 보이기 토글 시 호출 */
  onShowRowIconChange?: (show: boolean) => void;
}

export const MyTreeGridSettingButton = ({
  title = "컬럼 설정",
  defaultHeaders,
  headers,
  setHeaders,
  showRowIconSetting = false,
  showRowIcon = true,
  onShowRowIconChange,
}: MyTreeGridSettingButtonProps) => {
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
    const maxHeight = window.innerHeight * 0.3; // 30vh
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    // 아래 공간이 부족하면 위쪽으로 열기
    const shouldOpenAbove = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    const dropdownStyle: React.CSSProperties = shouldOpenAbove
      ? {
        bottom: window.innerHeight - buttonRect.top + 1,
        right: window.innerWidth - buttonRect.right,
        borderRadius: "6px",
      }
      : {
        top: buttonRect.bottom + 1,
        right: window.innerWidth - buttonRect.right,
        borderRadius: "6px",
      };

    return createPortal(
      <div
        ref={menuRef}
        className="fixed bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-lg z-[9999] flex flex-col my-scroll w-fit max-h-[30vh]"
        style={dropdownStyle}
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
          className="w-full px-3 py-[5px] text-left hover:bg-[var(--bg-tertiary)] items-center gap-[5px] whitespace-nowrap text-[12px] border-b border-[var(--border-1)]"
          onClick={() => {
            setHeaders(defaultHeaders.map((h) => ({ ...h, visible: true })));
          }}
        >
          기본설정 복원
        </button>
        {showRowIconSetting && onShowRowIconChange && (
          <label
            className="flex items-center gap-[6px] px-3 py-[5px] hover:bg-[var(--bg-tertiary)] cursor-pointer whitespace-nowrap border-b border-[var(--border-1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={showRowIcon}
              onChange={(e) => onShowRowIconChange(e.target.checked)}
            />
            <span className="text-[12px] text-[#46474C]">아이콘 보이기</span>
          </label>
        )}
        {headers.map((header) => (
          <label
            className="flex items-center gap-[6px] px-3 py-[5px] hover:bg-[var(--bg-tertiary)] cursor-pointer whitespace-nowrap"
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
            <span className="text-[12px] text-[#46474C]">{header.name}</span>
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
        content={<div className="text-center text-[12px]">{title}</div>}
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
