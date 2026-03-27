import { ChevronDownIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import React from "react";
import { MyTooltip } from "../my-tooltip";

export const MyTiptapEditorDropdownMenu = ({
  icon,
  children,
  title,
  tooltip,
  hideChevron = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  title: string;
  tooltip?: string;
  hideChevron?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // ownerDocument 사용 (PiP 윈도우 대응)
      const doc = dropdownRef.current?.ownerDocument ?? document;
      const win = doc.defaultView ?? window;
      doc.addEventListener("mousedown", handleClickOutside);
      // 위치 계산
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + win.scrollY + 4,
          left: rect.left + win.scrollX,
        });
      }

      return () => {
        doc.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // ownerDocument.body에 portal 렌더링 (PiP 대응)
  const portalTarget =
    dropdownRef.current?.ownerDocument?.body ?? document.body;

  return (
    <div className="relative" ref={dropdownRef}>
      <MyTooltip
        side="top"
        align="center"
        delayDuration={500}
        content={
          <div className="flex flex-col gap-2 p-1">
            <div className="text-sm font-semibold text-center">{title}</div>
            {tooltip && <div className="text-xs text-center">{tooltip}</div>}
          </div>
        }
      >
        <button
          className="p-1 hover:bg-[var(--bg-tertiary)] rounded-sm flex items-center gap-0 text-gray-500 dark:text-gray-300 bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
        >
          {icon}
          {!hideChevron && <ChevronDownIcon className="w-3 h-3" />}
        </button>
      </MyTooltip>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed border p-1 bg-white dark:bg-gray-800 rounded-sm shadow-lg flex flex-col gap-1 z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            onClick={(e) => {
              // 버튼 클릭 시 드롭다운 닫기
              const target = e.target as HTMLElement;
              if (target.tagName === "BUTTON" || target.closest("button")) {
                setTimeout(() => setIsOpen(false), 100);
              }
            }}
          >
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  onClose: () => setIsOpen(false),
                } as any);
              }
              return child;
            })}
          </div>,
          portalTarget
        )}
    </div>
  );
};

export const MyTiptapEditorDropdownMenuItem = ({
  title,
  onClick,
  onClose,
  children,
  tooltip,
}: {
  title?: string;
  onClick: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  tooltip?: string;
}) => {
  const handleClick = () => {
    onClick();
    onClose?.();
  };

  return (
    <MyTooltip
      side="right"
      align="center"
      content={tooltip || title}
      delayDuration={500}
    >
      <button
        className="w-full text-left text-xs hover:bg-[var(--bg-tertiary)] rounded-sm px-2 py-1 whitespace-nowrap flex items-center gap-2"
        onClick={handleClick}
      >
        {children && (
          <span className="flex-shrink-0 text-gray-500 dark:text-gray-300">
            {children}
          </span>
        )}
        {title && <span>{title}</span>}
      </button>
    </MyTooltip>
  );
};
