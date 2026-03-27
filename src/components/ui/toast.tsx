"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant =
  | "default"
  | "destructive"
  | "warning"
  | "info"
  | "success";

export interface ToastProps {
  id: string;
  variant?: ToastVariant;
  title?: string;
  children?: React.ReactNode;
  duration?: number; // 자동 닫기 시간 (ms), 0이면 자동 닫기 안함
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
  dismissible?: boolean;
  onAction?: (action: string) => void; // 액션 버튼 클릭 시 호출될 콜백
}

interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastVariants = {
  default: "bg-background border",
  destructive:
    "bg-background border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  warning:
    "bg-background border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
  info: "bg-background border-blue-500/50 text-blue-700 dark:text-blue-400 dark:border-blue-500 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
  success:
    "bg-background border-green-500/50 text-green-700 dark:text-green-400 dark:border-green-500 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
};

const toastIcons = {
  default: Info,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

// 개별 Toast 컴포넌트
function ToastItem({
  id,
  variant = "default",
  title,
  children,
  duration = 3000,
  onClose,
  className,
  showIcon = true,
  dismissible = true,
}: ToastProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const Icon = toastIcons[variant];

  useEffect(() => {
    // 애니메이션을 위한 지연
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // 자동 닫기 설정
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  // Toast 내부 버튼 클릭 감지
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(`[data-toast-id="${id}"]`) &&
        target.tagName === "BUTTON"
      ) {
        // Toast 내부의 버튼 클릭 시 Toast 닫기
        setTimeout(() => {
          handleClose();
        }, 100);
      }
    };

    document.addEventListener("click", handleButtonClick);
    return () => {
      document.removeEventListener("click", handleButtonClick);
    };
  }, [id]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      removeToast(id);
      onClose?.();
    }, 200); // 애니메이션 완료 후 제거
  };

  const handleMouseEnter = () => {
    // 마우스 호버 시 자동 닫기 일시 중지
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    // 마우스가 벗어나면 자동 닫기 재시작
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }
  };

  return (
    <div
      data-toast-id={id}
      data-testid="app-toast-item"
      data-toast-variant={variant}
      data-toast-title={title ?? ""}
      className={cn(
        "relative w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-200 ease-in-out",
        "transform translate-x-full opacity-0",
        isVisible && "translate-x-0 opacity-100",
        toastVariants[variant],
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showIcon && Icon && <Icon className="absolute left-4 top-4 h-4 w-4" />}
      {dismissible && (
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>
      )}
      <div className={cn("pr-6", showIcon && "pl-7")}>
        {title && (
          <h5 className="mb-1 font-medium leading-none tracking-tight">
            {title}
          </h5>
        )}
        {children && (
          <div className="text-sm [&_p]:leading-relaxed">{children}</div>
        )}
      </div>
    </div>
  );
}

// Toast Provider
export function ToastProvider({
  children,
  containerRef,
}: {
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLElement | null>;
}) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
      <ToastContainer containerRef={containerRef} />
    </ToastContext.Provider>
  );
}

// Toast Container (부모 컨테이너 또는 우측 하단에 고정)
function ToastContainer({
  containerRef,
}: {
  containerRef?: React.RefObject<HTMLElement | null>;
}) {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  // containerRef가 있으면 부모 컨테이너 내부에, 없으면 전체 화면 우측 하단에 위치
  const containerStyle = containerRef
    ? {
        position: "absolute" as const,
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
      }
    : {
        position: "fixed" as const,
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
      };

  return (
    <div
      className="flex flex-col gap-2 max-w-sm"
      style={containerStyle}
      data-testid="app-toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// 편의 함수들
export function useToastHelpers() {
  const { addToast, removeToast } = useToast();

  return {
    toast: (props: Omit<ToastProps, "id">) => addToast(props),

    success: (
      title: string,
      children?: React.ReactNode,
      options?: Partial<ToastProps>
    ) => addToast({ variant: "success", title, children, ...options }),

    error: (
      title: string,
      children?: React.ReactNode,
      options?: Partial<ToastProps>
    ) => addToast({ variant: "destructive", title, children, ...options }),

    warning: (
      title: string,
      children?: React.ReactNode,
      options?: Partial<ToastProps>
    ) => addToast({ variant: "warning", title, children, ...options }),

    info: (
      title: string,
      children?: React.ReactNode,
      options?: Partial<ToastProps>
    ) => addToast({ variant: "info", title, children, ...options }),

    // 자동 닫기 안함
    persistent: (props: Omit<ToastProps, "id">) =>
      addToast({ ...props, duration: 0 }),

    // 즉시 닫기
    dismissible: (props: Omit<ToastProps, "id">) =>
      addToast({ ...props, dismissible: true, duration: 0 }),

    // 특정 Toast 닫기
    removeToast: (id: string) => removeToast(id),
  };
}
