"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// 탭 아이템 타입
export interface MyTabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  testId?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: React.ReactNode;
}

// 탭 스타일 변형
type TabVariant = "underline" | "pill" | "boxed";
type TabSize = "xs" | "sm" | "default" | "lg";

interface MyTabsProps<T extends string = string> {
  tabs: MyTabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  variant?: TabVariant;
  size?: TabSize;
  className?: string;
  tabListClassName?: string;
  fullWidth?: boolean;
}

interface MyTabsContextValue<T extends string = string> {
  activeTab: T;
  onTabChange: (tab: T) => void;
}

const MyTabsContext = React.createContext<MyTabsContextValue | null>(null);

// 사이즈별 스타일
const sizeStyles: Record<TabSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-xs",
  default: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

// 변형별 컨테이너 스타일
const containerVariantStyles: Record<TabVariant, string> = {
  underline: "border-b border-[var(--border-1)]",
  pill: "bg-[var(--bg-2)] p-1 rounded-lg",
  boxed: "border border-[var(--border-1)] rounded-lg p-1",
};

// 변형별 탭 버튼 스타일
const tabVariantStyles: Record<
  TabVariant,
  { base: string; active: string; inactive: string }
> = {
  underline: {
    base: "relative font-medium transition-colors",
    active: "text-[var(--main-color)]",
    inactive: "text-[var(--gray-400)] hover:text-[var(--gray-200)]",
  },
  pill: {
    base: "font-medium transition-all rounded-md",
    active: "bg-[var(--bg-main)] text-[var(--gray-100)] shadow-sm",
    inactive: "text-[var(--gray-400)] hover:text-[var(--gray-200)]",
  },
  boxed: {
    base: "font-medium transition-all rounded-md border",
    active: "bg-[var(--main-color)] text-white border-[var(--main-color)]",
    inactive:
      "text-[var(--gray-400)] border-transparent hover:text-[var(--gray-200)] hover:bg-[var(--bg-2)]",
  },
};

/**
 * 재사용 가능한 탭 컴포넌트
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState<"tab1" | "tab2">("tab1");
 *
 * <MyTabs
 *   tabs={[
 *     { key: "tab1", label: "탭 1" },
 *     { key: "tab2", label: "탭 2", icon: <Icon /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   variant="underline"
 * />
 * ```
 */
export function MyTabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
  size = "default",
  className,
  tabListClassName,
  fullWidth = false,
}: MyTabsProps<T>) {
  return (
    <MyTabsContext.Provider
      value={{ activeTab, onTabChange: onTabChange as (tab: string) => void }}
    >
      <div className={cn("flex flex-col", className)}>
        <div
          className={cn(
            "flex",
            containerVariantStyles[variant],
            fullWidth && "w-full",
            tabListClassName
          )}
        >
          {tabs.map((tab) => (
            <MyTabButton
              key={tab.key}
              tab={tab}
              variant={variant}
              size={size}
              isActive={activeTab === tab.key}
              onClick={() => !tab.disabled && onTabChange(tab.key)}
              fullWidth={fullWidth}
            />
          ))}
        </div>
      </div>
    </MyTabsContext.Provider>
  );
}

// 탭 버튼 컴포넌트
interface MyTabButtonProps<T extends string = string> {
  tab: MyTabItem<T>;
  variant: TabVariant;
  size: TabSize;
  isActive: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}

function MyTabButton<T extends string = string>({
  tab,
  variant,
  size,
  isActive,
  onClick,
  fullWidth,
}: MyTabButtonProps<T>) {
  const variantStyle = tabVariantStyles[variant];

  return (
    <button
      type="button"
      data-testid={tab.testId}
      className={cn(
        "flex items-center justify-center gap-1.5",
        variantStyle.base,
        sizeStyles[size],
        isActive ? variantStyle.active : variantStyle.inactive,
        tab.disabled && "opacity-50 cursor-not-allowed",
        fullWidth && "flex-1"
      )}
      onClick={onClick}
      disabled={tab.disabled}
    >
      {tab.icon && <span className="shrink-0">{tab.icon}</span>}
      <span>{tab.label}</span>
      {tab.badge && <span className="ml-1">{tab.badge}</span>}
      {/* Underline 인디케이터 */}
      {variant === "underline" && isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--main-color)]" />
      )}
    </button>
  );
}

// 탭 컨텐츠 영역 (선택적 사용)
interface MyTabContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MyTabContent({ children, className }: MyTabContentProps) {
  return <div className={cn("flex-1 min-h-0", className)}>{children}</div>;
}

// 탭과 컨텐츠를 함께 사용하는 컴포넌트
interface MyTabPanelProps<T extends string = string> {
  tabs: MyTabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  children: React.ReactNode;
  variant?: TabVariant;
  size?: TabSize;
  className?: string;
  tabListClassName?: string;
  contentClassName?: string;
  fullWidth?: boolean;
}

export function MyTabPanel<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  children,
  variant = "underline",
  size = "default",
  className,
  tabListClassName,
  contentClassName,
  fullWidth = false,
}: MyTabPanelProps<T>) {
  return (
    <div className={cn("flex flex-col", className)}>
      <MyTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        variant={variant}
        size={size}
        tabListClassName={tabListClassName}
        fullWidth={fullWidth}
      />
      <MyTabContent className={contentClassName}>{children}</MyTabContent>
    </div>
  );
}

export default MyTabs;
