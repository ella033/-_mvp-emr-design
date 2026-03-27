"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  isBorder?: boolean;
  isFixedSize?: boolean;
  className?: string;
  storageKey?: string;
}

export function MyAccordion({
  title,
  children,
  defaultOpen = false,
  isBorder = true,
  isFixedSize = false,
  className = "",
  storageKey, // localStorage 키 prop 추가
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage에서 상태 불러오기
  useEffect(() => {
    if (storageKey) {
      try {
        const savedState = safeLocalStorage.getItem(storageKey);
        if (savedState !== null) {
          setIsOpen(JSON.parse(savedState));
        }
      } catch (error) {
        console.error(`localStorage에서 ${storageKey} 불러오기 실패:`, error);
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    // localStorage에 상태 저장
    if (storageKey) {
      try {
        safeLocalStorage.setItem(storageKey, JSON.stringify(newState));
      } catch (error) {
        console.error(`localStorage에 ${storageKey} 저장 실패:`, error);
      }
    }
  };

  // 로딩 중일 때는 최소한의 레이아웃만 렌더링
  if (!isLoaded && storageKey) {
    return (
      <div
        className={`${
          isBorder ? "border border-[var(--border-primary)]" : ""
        } ${className}`}
      >
        <div className="w-full flex items-center justify-between px-[10px] py-[5px]">
          <span
            className={`font-medium text-[var(--text-primary)] ${
              isFixedSize ? "text-[12px]" : ""
            }`}
          >
            {title}
          </span>
          <ChevronDownIcon
            className={`${
              isFixedSize ? "w-[12px] h-[12px]" : "w-4 h-4"
            } text-[var(--text-secondary)]`}
          />
        </div>
      </div>
    );
  }

  return (
    <AccordionItem
      title={title}
      isOpen={isOpen}
      onToggle={handleToggle}
      isBorder={isBorder}
      isFixedSize={isFixedSize}
      className={className}
    >
      {children}
    </AccordionItem>
  );
}

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isBorder?: boolean;
  isFixedSize?: boolean;
  className?: string;
}

export function AccordionItem({
  title,
  children,
  isOpen,
  onToggle,
  isBorder = true,
  isFixedSize = false,
  className = "",
}: AccordionItemProps) {
  return (
    <div
      className={`${
        isBorder ? "border border-[var(--border-primary)]" : ""
      } ${className}`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-[10px] py-[5px] hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <span
          className={`font-medium text-[var(--text-primary)] ${
            isFixedSize ? "text-[12px]" : ""
          }`}
        >
          {title}
        </span>
        <ChevronDownIcon
          className={`${
            isFixedSize ? "w-[12px] h-[12px]" : "w-4 h-4"
          } text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`${
            isBorder ? "border-t border-[var(--border-primary)]" : ""
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
