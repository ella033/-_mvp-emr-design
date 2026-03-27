"use client";

/**
 * AlertBar 컴포넌트
 * 
 * 상위 컴포넌트에 붙어서 표시되는 알림 바 컴포넌트입니다.
 * Toast와 유사하지만, 고정된 위치가 아닌 원하는 위치에 배치할 수 있습니다.
 * 
 * 사용법:
 * 
 * 1. AlertBarProvider로 컴포넌트 감싸기
 *    import { AlertBarProvider } from "@/components/ui/alert-bar";
 *    <AlertBarProvider>
 *      <YourComponent />
 *    </AlertBarProvider>
 * 
 * 2. 컴포넌트 내부에서 사용
 *    import { useAlertBarHelpers, AlertBarContainerDirect } from "@/components/ui/alert-bar";
 *    
 *    function YourComponent() {
 *      const alertBarHelper = useAlertBarHelpers();
 *      
 *      // alertBar 표시
 *      const icon = <img src="/icon/ic_line_medical_report.svg" className="w-4 h-4" />;
 *      const content = <span>예약처방이 있습니다.</span>;
 *      alertBarHelper.info(icon, content, {
 *        id: "reception-123", // optional: customId 지정 가능
 *        onClose: () => console.log("closed")
 *      });
 *      
 *      // alertBar 제거
 *      alertBarHelper.removeAlertBar("reception-123");
 *      
 *      return (
 *        <>
 *          <AlertBarContainerDirect />
 *          <div>Your Content</div>
 *        </>
 *      );
 *    }
 * 
 * 주요 컴포넌트:
 * - AlertBarProvider: Context Provider로 alertBar를 사용하는 컴포넌트들을 감싸야 함
 * - AlertBarContainerDirect: 실제 alertBar를 렌더링하는 컴포넌트 (원하는 위치에 배치)
 * - useAlertBarHelpers: alertBar를 추가/제거하는 편의 함수 제공
 * 
 * Variant:
 * - "default": 기본 스타일 (bg-[var(--bg-2)])
 * - "info": 정보 스타일 (bg-[var(--red-1)])
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

export type AlertBarVariant = "default" | "info";

export interface AlertBarProps {
  id: string;
  variant?: AlertBarVariant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  dismissible?: boolean;
}

interface AlertBarContextType {
  alertBars: AlertBarProps[];
  addAlertBar: (alertBar: Omit<AlertBarProps, "id">, customId?: string) => string;
  removeAlertBar: (id: string) => void;
  clearAlertBars: () => void;
}

const AlertBarContext = createContext<AlertBarContextType | undefined>(undefined);

const alertBarVariants = {
  default: "bg-[var(--bg-2)] text-[var(--gray-100)]",
  info: "bg-[var(--red-1)] text-[var(--gray-100)]",
};

// 개별 AlertBar 컴포넌트
function AlertBarItem({
  id,
  variant = "default",
  icon,
  children,
  onClose,
  className,
  dismissible = true,
}: AlertBarProps) {
  const { removeAlertBar } = useAlertBar();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      removeAlertBar(id);
      onClose?.();
    }, 200); // 애니메이션 완료 후 제거
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-2 transition-all duration-200 ease-in-out",
        "transform",
        !isClosing && "translate-y-0 opacity-100",
        isClosing && "translate-y-full opacity-0",
        alertBarVariants[variant],
        className
      )}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <span className="text-sm flex-1">{children}</span>
      {dismissible && (
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center justify-center w-4 h-4 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="알림 닫기"
        >
          <img
            src="/icon/ic_line_close.svg"
            alt="닫기"
            className="w-4 h-4"
          />
        </button>
      )}
    </div>
  );
}

// ReactNode의 텍스트 내용을 추출하는 헬퍼 함수
const getReactNodeText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map(getReactNodeText).join("");
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode; src?: string };
    if (props.children) {
      return getReactNodeText(props.children);
    }
    // img 태그인 경우 src를 반환
    if (node.type === "img" && props.src) {
      return props.src;
    }
  }
  return "";
};

// icon의 고유 식별자를 추출하는 헬퍼 함수
const getIconKey = (icon: React.ReactNode | undefined): string => {
  if (!icon) return "";
  if (React.isValidElement(icon)) {
    const props = icon.props as { src?: string };
    if (icon.type === "img" && props.src) {
      return props.src;
    }
    // 다른 타입의 아이콘도 처리 가능하도록 확장
    return String(icon.type);
  }
  return String(icon);
};

// 부모 컴포넌트의 위쪽으로 AlertBar 생성
export function AlertBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alertBars, setAlertBars] = useState<AlertBarProps[]>([]);
  const alertBarsRef = useRef<AlertBarProps[]>([]);

  // alertBars 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    alertBarsRef.current = alertBars;
  }, [alertBars]);

  const addAlertBar = (alertBar: Omit<AlertBarProps, "id">, customId?: string) => {
    // customId가 제공되면 해당 id 사용, 아니면 랜덤 생성
    const id = customId || Math.random().toString(36).substr(2, 9);

    // customId가 제공된 경우, 같은 id가 이미 있으면 업데이트
    if (customId) {
      setAlertBars((prev) => {
        const existingIndex = prev.findIndex((bar) => bar.id === customId);
        if (existingIndex !== -1) {
          // 이미 존재하면 업데이트
          const updated = [...prev];
          updated[existingIndex] = { ...alertBar, id: customId };
          return updated;
        }
        // 없으면 추가
        return [...prev, { ...alertBar, id: customId }];
      });
      return id;
    }

    // customId가 없는 경우 중복 체크
    const contentText = getReactNodeText(alertBar.children);
    const iconKey = getIconKey(alertBar.icon);
    const variant = alertBar.variant || "default";

    // 최신 상태를 ref로부터 가져와서 중복 체크
    const duplicateBar = alertBarsRef.current.find((existingBar) => {
      const existingContentText = getReactNodeText(existingBar.children);
      const existingIconKey = getIconKey(existingBar.icon);
      const existingVariant = existingBar.variant || "default";

      return (
        contentText === existingContentText &&
        iconKey === existingIconKey &&
        variant === existingVariant
      );
    });

    // 중복이면 기존 id 반환
    if (duplicateBar) {
      return duplicateBar.id;
    }

    // 중복이 아니면 새로 생성
    const newAlertBar = { ...alertBar, id };

    setAlertBars((prev) => {
      // 한 번 더 중복 체크 (race condition 방지)
      const isStillDuplicate = prev.some((existingBar) => {
        const existingContentText = getReactNodeText(existingBar.children);
        const existingIconKey = getIconKey(existingBar.icon);
        const existingVariant = existingBar.variant || "default";

        return (
          contentText === existingContentText &&
          iconKey === existingIconKey &&
          variant === existingVariant
        );
      });

      if (isStillDuplicate) {
        return prev;
      }

      return [...prev, newAlertBar];
    });

    return id;
  };

  const removeAlertBar = (id: string) => {
    setAlertBars((prev) => prev.filter((alertBar) => alertBar.id !== id));
  };

  const clearAlertBars = () => {
    setAlertBars([]);
  };

  return (
    <AlertBarContext.Provider
      value={{ alertBars, addAlertBar, removeAlertBar, clearAlertBars }}
    >
      {children}
    </AlertBarContext.Provider>
  );
}


// Hook
export function useAlertBar() {
  const context = useContext(AlertBarContext);
  if (context === undefined) {
    throw new Error("useAlertBar must be used within an AlertBarProvider");
  }
  return context;
}

// 편의 함수들
export function useAlertBarHelpers() {
  const { addAlertBar, removeAlertBar } = useAlertBar();

  return {
    alertBar: (props: Omit<AlertBarProps, "id">) => addAlertBar(props),

    info: (
      icon: React.ReactNode,
      content: React.ReactNode,
      options?: Partial<Omit<AlertBarProps, "id" | "variant" | "icon" | "children">> & { id?: string }
    ) => {
      const { id: customId, ...restOptions } = options || {};
      return addAlertBar({
        variant: "info",
        icon,
        children: content,
        ...restOptions
      }, customId);
    },

    default: (
      icon: React.ReactNode,
      content: React.ReactNode,
      options?: Partial<Omit<AlertBarProps, "id" | "variant" | "icon" | "children">>
    ) => {
      return addAlertBar({
        variant: "default",
        icon,
        children: content,
        ...options
      });
    },

    // 특정 AlertBar 닫기
    removeAlertBar: (id: string) => removeAlertBar(id),
  };
}

// AlertBarContainer를 직접 렌더링하는 컴포넌트 (상위 컴포넌트에 붙도록)
export function AlertBarContainerDirect() {
  const { alertBars } = useAlertBar();

  if (alertBars.length === 0) return null;

  return (
    <div className="flex flex-col w-full">
      {alertBars.map((alertBar) => (
        <AlertBarItem key={alertBar.id} {...alertBar} />
      ))}
    </div>
  );
}

