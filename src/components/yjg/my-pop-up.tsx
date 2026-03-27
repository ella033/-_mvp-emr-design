"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { MyButton } from "@/components/yjg/my-button";
import { createPortal } from "react-dom";
import { ToastProvider } from "@/components/ui/toast";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";

// 팝업 설정 상수
const POPUP_SETTINGS = {
  scope: "user" as const,
  category: "popup",
};

// debounce 타이머 저장용 맵
const savePopupTimers: Map<string, NodeJS.Timeout> = new Map();

// CSS 값을 파싱하고 픽셀 값으로 변환하는 유틸리티 함수
const parseCSSValue = (value: string): number => {
  const trimmed = value.trim();

  // 픽셀 값
  if (trimmed.endsWith("px")) {
    return parseFloat(trimmed);
  }

  // 뷰포트 너비 (vw)
  if (trimmed.endsWith("vw")) {
    const percentage = parseFloat(trimmed) / 100;
    return typeof window !== "undefined"
      ? window.innerWidth * percentage
      : 1200 * percentage;
  }

  // 뷰포트 높이 (vh)
  if (trimmed.endsWith("vh")) {
    const percentage = parseFloat(trimmed) / 100;
    return typeof window !== "undefined"
      ? window.innerHeight * percentage
      : 800 * percentage;
  }

  // 퍼센트 (%)
  if (trimmed.endsWith("%")) {
    const percentage = parseFloat(trimmed) / 100;
    return typeof window !== "undefined"
      ? window.innerWidth * percentage
      : 1200 * percentage; // 기본적으로 너비 기준
  }

  // 숫자만 있는 경우 (픽셀로 간주)
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num;
  }

  // 기본값
  return 300;
};

// CSS 값으로부터 실제 픽셀 크기를 계산하는 함수
const calculateModalSize = (width: string, height: string) => {
  const modalWidth = parseCSSValue(width);
  const modalHeight = parseCSSValue(height);

  // 화면 크기 가져오기
  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  // 최소 크기 보장 및 최대 크기 제한 (화면 크기)
  const clampedWidth = Math.min(Math.max(modalWidth, 100), screenWidth);
  const clampedHeight = Math.min(Math.max(modalHeight, 100), screenHeight);

  return {
    width: clampedWidth,
    height: clampedHeight,
    centerX: (screenWidth - clampedWidth) / 2,
    centerY: (screenHeight - clampedHeight) / 2,
  };
};

// Settings store에서 설정 불러오기 (화면 내부로 위치 및 크기 조정 포함)
const loadPopupSettings = (
  storageKey: string,
  defaultSettings: {
    size: { width: number; height: number };
    position: { x: number; y: number };
  }
) => {
  if (typeof window === "undefined") return defaultSettings;

  try {
    const state = useSettingsStore.getState();
    const savedSetting = state.getSettingsByCategoryAndPageContext(
      POPUP_SETTINGS.category,
      storageKey
    );
    const saved = savedSetting?.settings;

    if (saved) {
      let size = saved.size || defaultSettings.size;
      let position = saved.position || defaultSettings.position;

      // 저장된 크기가 현재 화면 크기를 초과하면 화면 크기로 제한
      size = {
        width: Math.min(size.width, window.innerWidth),
        height: Math.min(size.height, window.innerHeight),
      };

      // 저장된 위치가 현재 화면 내부에 있는지 체크하고 조정
      const maxX = Math.max(0, window.innerWidth - size.width);
      const maxY = Math.max(0, window.innerHeight - size.height);
      position = {
        x: Math.max(0, Math.min(position.x, maxX)),
        y: Math.max(0, Math.min(position.y, maxY)),
      };

      return { size, position };
    }
  } catch (error) {
    console.error("Failed to load popup settings:", error);
  }

  return defaultSettings;
};

// 설정 저장 (debounce 적용, API로 저장)
const savePopupSettings = (
  storageKey: string,
  settings: {
    size: { width: number; height: number };
    position: { x: number; y: number };
  }
) => {
  if (typeof window === "undefined") return;

  try {
    // Settings store 즉시 업데이트
    useSettingsStore.getState().updateSettingLocally({
      scope: POPUP_SETTINGS.scope,
      category: POPUP_SETTINGS.category,
      pageContext: storageKey,
      settings: settings,
    });

    // 기존 타이머 클리어
    const existingTimer = savePopupTimers.get(storageKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 500ms debounce 후 API로 저장
    const timer = setTimeout(() => {
      SettingsService.createOrUpdateSetting({
        scope: POPUP_SETTINGS.scope,
        category: POPUP_SETTINGS.category,
        pageContext: storageKey,
        settings: settings,
      }).catch((error) => {
        console.error("[MyPopup] 설정 저장 실패:", error);
      });

      savePopupTimers.delete(storageKey);
    }, 500);

    savePopupTimers.set(storageKey, timer);
  } catch (error) {
    console.error("Failed to save popup settings:", error);
  }
};

interface MyPopupProps {
  isOpen: boolean;
  onCloseAction: () => void;
  title?: React.ReactNode;
  titleIcon?: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  initialPosition?: { x: number; y: number };
  closeOnOutsideClick?: boolean;
  fitContent?: boolean;
  hideHeader?: boolean;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  localStorageKey?: string; // localStorage 키 추가
  alwaysCenter?: boolean; // 항상 중앙에 위치
}

export default function MyPopup({
  isOpen,
  onCloseAction,
  title = "",
  titleIcon,
  testId,
  children,
  width = "30vw",
  height = "30vw",
  minWidth = "100px",
  minHeight = "100px",
  initialPosition,
  closeOnOutsideClick = true,
  fitContent = false,
  hideHeader = false,
  onSizeChange,
  onPositionChange,
  localStorageKey,
  alwaysCenter = false,
}: MyPopupProps) {
  // localStorage에서 설정 불러오기 (localStorageKey가 있는 경우)
  const defaultSettings = (() => {
    if (fitContent) {
      return {
        size: { width: 0, height: 0 }, // fitContent는 크기가 동적이므로 0으로 설정
        position: {
          x: typeof window !== "undefined" ? window.innerWidth / 2 : 600,
          y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
        },
      };
    }
    const {
      width: modalWidth,
      height: modalHeight,
      centerX,
      centerY,
    } = calculateModalSize(width, height);
    return {
      size: { width: modalWidth, height: modalHeight },
      position: { x: centerX, y: centerY },
    };
  })();

  const savedSettings = localStorageKey
    ? loadPopupSettings(localStorageKey, defaultSettings)
    : null;

  const [position, setPosition] = useState(() => {
    // localStorage에 저장된 설정이 있으면 사용
    if (savedSettings) {
      // 화면 크기로 위치 제한 (SSR 환경 대응)
      const screenWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const screenHeight =
        typeof window !== "undefined" ? window.innerHeight : 800;
      const size = savedSettings.size;
      const maxX = Math.max(0, screenWidth - size.width);
      const maxY = Math.max(0, screenHeight - size.height);
      return {
        x: Math.max(0, Math.min(savedSettings.position.x, maxX)),
        y: Math.max(0, Math.min(savedSettings.position.y, maxY)),
      };
    }

    if (initialPosition) {
      // {x: 0, y: 0}인 경우 중앙 정렬
      if (initialPosition.x === 0 && initialPosition.y === 0) {
        if (fitContent) {
          // fitContent가 true일 때는 임시로 화면 중앙에 위치 (나중에 정확한 위치로 조정됨)
          return {
            x: typeof window !== "undefined" ? window.innerWidth / 2 : 600,
            y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
          };
        }
        const { centerX, centerY } = calculateModalSize(width, height);
        return { x: centerX, y: centerY };
      }
      return initialPosition;
    }

    if (fitContent) {
      // fitContent가 true일 때는 임시로 화면 중앙에 위치 (나중에 정확한 위치로 조정됨)
      return {
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 600,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
      };
    }

    const { centerX, centerY } = calculateModalSize(width, height);
    return { x: centerX, y: centerY };
  });
  const [isCentered, setIsCentered] = useState(!alwaysCenter); // alwaysCenter일 때는 false로 시작
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [currentSize, setCurrentSize] = useState(() => {
    // localStorage에 저장된 크기가 있으면 사용
    if (savedSettings && !fitContent) {
      // 화면 크기로 제한 (SSR 환경 대응)
      const screenWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const screenHeight =
        typeof window !== "undefined" ? window.innerHeight : 800;
      return {
        width: Math.min(savedSettings.size.width, screenWidth),
        height: Math.min(savedSettings.size.height, screenHeight),
      };
    }

    const { width: modalWidth, height: modalHeight } = calculateModalSize(
      width,
      height
    );
    return { width: modalWidth, height: modalHeight };
  });
  const [hasBeenResized, setHasBeenResized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 팝업이 열릴 때마다 크기 및 위치가 화면을 초과하는지 재확인
  useEffect(() => {
    if (!isOpen || fitContent || typeof window === "undefined") return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let needsUpdate = false;
    let newSize = { ...currentSize };
    let newPosition = { ...position };

    // 현재 크기가 화면을 초과하면 조정
    if (currentSize.width > screenWidth || currentSize.height > screenHeight) {
      newSize = {
        width: Math.min(currentSize.width, screenWidth),
        height: Math.min(currentSize.height, screenHeight),
      };
      needsUpdate = true;
    }

    // 위치가 화면 밖으로 나갔는지 체크
    const maxX = Math.max(0, screenWidth - newSize.width);
    const maxY = Math.max(0, screenHeight - newSize.height);
    if (
      position.x > maxX ||
      position.y > maxY ||
      position.x < 0 ||
      position.y < 0
    ) {
      newPosition = {
        x: Math.max(0, Math.min(position.x, maxX)),
        y: Math.max(0, Math.min(position.y, maxY)),
      };
      needsUpdate = true;
    }

    if (needsUpdate) {
      setCurrentSize(newSize);
      setPosition(newPosition);

      // localStorage에 저장
      if (localStorageKey) {
        savePopupSettings(localStorageKey, {
          size: newSize,
          position: newPosition,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // 팝업이 열릴 때마다 실행

  // width나 height가 변경될 때 위치 재계산 (localStorage 설정이 없고 리사이즈되지 않은 경우에만)
  useEffect(() => {
    // localStorage에서 불러온 설정이 없고 initialPosition도 없는 경우에만 중앙 정렬
    if (!savedSettings && !initialPosition) {
      const { centerX, centerY } = calculateModalSize(width, height);
      setPosition({ x: centerX, y: centerY });
    }

    // localStorage에서 불러온 설정이 없고 리사이즈되지 않은 상태에서만 currentSize 업데이트
    if (!savedSettings && !hasBeenResized) {
      const { width: modalWidth, height: modalHeight } = calculateModalSize(
        width,
        height
      );

      setCurrentSize({ width: modalWidth, height: modalHeight });
    }
  }, [width, height, initialPosition, hasBeenResized, savedSettings]);

  // fitContent가 true일 때 컨텐츠 크기에 맞게 중앙 위치 재계산 (localStorage 설정이 없는 경우에만)
  useLayoutEffect(() => {
    if (
      fitContent &&
      modalRef.current &&
      !hasBeenResized &&
      isOpen &&
      !savedSettings
    ) {
      // DOM이 렌더링된 후 실제 크기를 측정
      const rect = modalRef.current.getBoundingClientRect();

      // 실제 측정된 크기로 중앙 위치 계산
      const centerX = Math.max(
        0,
        typeof window !== "undefined"
          ? (window.innerWidth - rect.width) / 2
          : (1200 - rect.width) / 2
      );
      const centerY = Math.max(
        0,
        typeof window !== "undefined"
          ? (window.innerHeight - rect.height) / 2
          : (800 - rect.height) / 2
      );

      // 항상 정확한 중앙 위치로 설정
      setPosition({ x: centerX, y: centerY });
    }
  }, [fitContent, hasBeenResized, isOpen, savedSettings]);

  // alwaysCenter가 true일 때 팝업이 열릴 때마다 중앙 위치로 리셋
  useEffect(() => {
    if (alwaysCenter && isOpen) {
      // 팝업이 열릴 때 먼저 숨김 상태로 설정
      setIsCentered(false);

      // DOM이 완전히 렌더링된 후 위치 계산
      const calculateCenter = () => {
        if (modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          const centerX = Math.max(
            0,
            typeof window !== "undefined"
              ? (window.innerWidth - rect.width) / 2
              : (1200 - rect.width) / 2
          );
          const centerY = Math.max(
            0,
            typeof window !== "undefined"
              ? (window.innerHeight - rect.height) / 2
              : (800 - rect.height) / 2
          );
          setPosition({ x: centerX, y: centerY });
          // 위치 계산 완료 후 표시
          setIsCentered(true);
        }
      };

      // requestAnimationFrame으로 다음 프레임에서 계산
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(calculateCenter);
      });

      return () => cancelAnimationFrame(frameId);
    }
    return undefined;
  }, [alwaysCenter, isOpen]);

  // ESC 키 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnOutsideClick) {
        event.preventDefault();
        onCloseAction();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeOnOutsideClick, onCloseAction]);

  // 화면 리사이즈 시 팝업이 화면 밖으로 나가지 않도록 위치 및 크기 조정
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (typeof window === "undefined") return;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // 실제 모달 크기 가져오기
      let modalWidth = currentSize.width;
      let modalHeight = currentSize.height;
      if (fitContent && modalRef.current) {
        const rect = modalRef.current.getBoundingClientRect();
        modalWidth = rect.width;
        modalHeight = rect.height;
      }

      // 팝업 크기가 화면보다 크면 화면 크기로 제한
      let newWidth = modalWidth;
      let newHeight = modalHeight;
      let sizeChanged = false;

      if (!fitContent) {
        if (modalWidth > screenWidth) {
          newWidth = screenWidth;
          sizeChanged = true;
        }
        if (modalHeight > screenHeight) {
          newHeight = screenHeight;
          sizeChanged = true;
        }

        if (sizeChanged) {
          const newSize = { width: newWidth, height: newHeight };
          setCurrentSize(newSize);

          if (onSizeChange) {
            onSizeChange(newSize);
          }
        }
      }

      // 현재 위치가 화면 밖으로 나갔는지 체크
      const maxX = Math.max(0, screenWidth - newWidth);
      const maxY = Math.max(0, screenHeight - newHeight);

      const newX = Math.max(0, Math.min(position.x, maxX));
      const newY = Math.max(0, Math.min(position.y, maxY));

      // 위치가 변경되었으면 업데이트
      if (newX !== position.x || newY !== position.y) {
        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);

        // 위치 변경 콜백 호출
        if (onPositionChange) {
          onPositionChange(newPosition);
        }
      }

      // localStorage에 저장 (localStorageKey가 있는 경우, fitContent가 아닐 때만)
      if (
        localStorageKey &&
        !fitContent &&
        (sizeChanged || newX !== position.x || newY !== position.y)
      ) {
        savePopupSettings(localStorageKey, {
          size: { width: newWidth, height: newHeight },
          position: { x: newX, y: newY },
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    isOpen,
    position,
    currentSize,
    fitContent,
    onPositionChange,
    onSizeChange,
    localStorageKey,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (modalRef.current) {
      setIsDragging(true);
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // 실제 모달 크기 가져오기 (fitContent일 때는 DOM에서 측정)
        let modalWidth = currentSize.width;
        let modalHeight = currentSize.height;
        if (fitContent && modalRef.current) {
          const rect = modalRef.current.getBoundingClientRect();
          modalWidth = rect.width;
          modalHeight = rect.height;
        }

        // 화면 경계 체크 - 뷰포트 내에서만 이동 가능
        if (typeof window !== "undefined") {
          const maxX = window.innerWidth - modalWidth;
          const maxY = window.innerHeight - modalHeight;

          // 최소값 0, 최대값은 화면 크기 - 모달 크기
          newX = Math.max(0, Math.min(newX, maxX));
          newY = Math.max(0, Math.min(newY, maxY));
        }

        const newPosition = { x: newX, y: newY };
        setPosition(newPosition);

        // 위치 변경 콜백 호출
        if (onPositionChange) {
          onPositionChange(newPosition);
        }

        // localStorage에 저장 (localStorageKey가 있는 경우, fitContent가 아닐 때만)
        if (localStorageKey && !fitContent) {
          savePopupSettings(localStorageKey, {
            size: currentSize,
            position: newPosition,
          });
        }
      } else if (isResizing) {
        e.preventDefault();
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        // 화면 크기 가져오기
        const screenWidth =
          typeof window !== "undefined" ? window.innerWidth : 1200;
        const screenHeight =
          typeof window !== "undefined" ? window.innerHeight : 800;

        // 최소/최대 크기 제한 (최대 크기는 화면 크기)
        const newWidth = Math.min(
          Math.max(parseCSSValue(minWidth), resizeStartSize.width + deltaX),
          screenWidth
        );
        const newHeight = Math.min(
          Math.max(parseCSSValue(minHeight), resizeStartSize.height + deltaY),
          screenHeight
        );

        const newSize = { width: newWidth, height: newHeight };
        setCurrentSize(newSize);

        // 크기 변경 콜백 호출
        if (onSizeChange) {
          onSizeChange(newSize);
        }

        // localStorage에 저장 (localStorageKey가 있는 경우)
        if (localStorageKey) {
          savePopupSettings(localStorageKey, {
            size: newSize,
            position: position,
          });
        }
      }
    },
    [
      isDragging,
      isResizing,
      dragOffset,
      minWidth,
      minHeight,
      resizeStartPos,
      resizeStartSize,
      currentSize,
      position,
      onPositionChange,
      onSizeChange,
      localStorageKey,
      fitContent,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      // 리사이즈 완료 시 hasBeenResized를 true로 설정
      setHasBeenResized(true);
    }

    // 상태를 강제로 false로 설정
    setIsDragging(false);
    setIsResizing(false);
  }, [isResizing, isDragging, currentSize, hasBeenResized]);

  useEffect(() => {
    if (isDragging || isResizing) {
      const handleMouseMoveWrapper = (e: MouseEvent) => {
        handleMouseMove(e);
      };

      const handleMouseUpWrapper = () => {
        handleMouseUp();
      };

      document.addEventListener("mousemove", handleMouseMoveWrapper);
      document.addEventListener("mouseup", handleMouseUpWrapper);

      return () => {
        document.removeEventListener("mousemove", handleMouseMoveWrapper);
        document.removeEventListener("mouseup", handleMouseUpWrapper);
      };
    }
    return undefined;
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  const popupContent = (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black/20`}
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          e.stopPropagation();
          onCloseAction();
        }
      }}
    >
      <div
        ref={modalRef}
        data-testid={testId}
        className={`bg-[var(--card-bg)] border border-[var(--border-secondary)] shadow-lg rounded-md flex flex-col relative overflow-hidden ${fitContent ? "w-fit h-fit max-w-[90vw] max-h-[90vh]" : ""
          }`}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: fitContent ? "auto" : `${currentSize.width}px`,
          height: fitContent ? "auto" : `${currentSize.height}px`,
          minWidth: fitContent ? undefined : minWidth,
          minHeight: fitContent ? undefined : minHeight,
          cursor: isDragging ? "grabbing" : "default",
          opacity: alwaysCenter && !isCentered ? 0 : 1,
          transition: "opacity 0.05s ease-in-out",
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <ToastProvider containerRef={modalRef}>
          {!hideHeader && (
            <div
              className="flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
              onMouseUp={(e) => {
                e.stopPropagation();
                setIsDragging(false);
              }}
              onContextMenu={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-[10px] py-[5px]">
                {titleIcon && <div>{titleIcon}</div>}
                {typeof title === "string" ? (
                  <div className="font-bold text-[var(--text-primary)] text-[14px] ">
                    {title}
                  </div>
                ) : (
                  title
                )}
              </div>
              <button
                className="p-[10px] hover:bg-[var(--close-btn-hover)]"
                onClick={onCloseAction}
              >
                <XMarkIcon className="w-[16px] h-[16px]" />
              </button>
            </div>
          )}
          <div
            className={`flex flex-col flex-1 px-[8px] pt-0 pb-[8px] min-h-0
              }`}
            onContextMenu={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {/* 우측하단 리사이즈 핸들 - fitContent일 때는 숨김 */}
          {!fitContent && (
            <div
              className="absolute bottom-0 right-0 w-[15px] h-[15px] cursor-se-resize bg-transparent hover:bg-[var(--border-secondary)] opacity-50 hover:opacity-100 transition-opacity flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();

                // 현재 크기를 기준으로 리사이즈 시작
                setResizeStartSize({
                  width: currentSize.width,
                  height: currentSize.height,
                });
                setResizeStartPos({ x: e.clientX, y: e.clientY });

                // 리사이즈 상태 설정
                setIsResizing(true);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setIsResizing(false);
              }}
              onContextMenu={(e) => e.stopPropagation()}
            >
              <ChevronDoubleRightIcon className="w-[15px] h-[15px] rotate-45 text-[var(--text-secondary)]" />
            </div>
          )}
        </ToastProvider>
      </div>
    </div>
  );

  // Portal을 사용하여 DOM 최상위로 렌더링
  return createPortal(popupContent, document.body);
}

interface MyPopupYesNoProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: (param?: any) => void; // 선택적 파라미터 추가
  title?: string;
  message?: string;
  testId?: string;
  confirmButtonTestId?: string;
  cancelButtonTestId?: string;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
  confirmParam?: any; // 파라미터를 전달할 수 있는 prop 추가
  hideHeader?: boolean;
}

export function MyPopupYesNo({
  isOpen,
  onCloseAction,
  onConfirmAction,
  title,
  message,
  testId,
  confirmButtonTestId,
  cancelButtonTestId,
  confirmText = "확인",
  cancelText = "취소",
  children,
  confirmParam, // 파라미터 추가
  hideHeader = false,
}: MyPopupYesNoProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirmAction(confirmParam); // 파라미터와 함께 호출
      }
    };

    // 팝업이 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirmAction, confirmParam]);

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      title={title}
      testId={testId}
      fitContent={true}
      hideHeader={hideHeader}
    >
      <div className="flex flex-col gap-[20px] min-w-[300px]">
        <div className="flex-1 flex flex-col gap-1 px-2 py-1">
          <div className="text-base text-[var(--text-primary)] whitespace-pre-line">
            {message}
          </div>
          {children && children}
        </div>
        <div className="flex justify-end gap-[10px]">
          <MyButton variant="outline" onClick={onCloseAction} data-testid={cancelButtonTestId}>
            <div className="flex items-center gap-1">
              {cancelText}
              <span className="text-xs text-[var(--gray-400)]">(Esc)</span>
            </div>
          </MyButton>
          <MyButton
            data-testid={confirmButtonTestId}
            onClick={() => onConfirmAction(confirmParam)} // 파라미터와 함께 호출
          >
            <div className="flex items-center gap-1">
              {confirmText}
              <span className="text-xs text-[var(--gray-600)]">(Enter)</span>
            </div>
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}

interface MyPopupMsgProps {
  isOpen: boolean;
  onCloseAction: () => void;
  title: string;
  msgType: "error" | "warning" | "info" | "success";
  message?: string;
  confirmText?: string;
  onConfirmAction?: () => void;
  children?: React.ReactNode;
  hideHeader?: boolean;
}

export function MyPopupMsg({
  isOpen,
  onCloseAction,
  title,
  msgType,
  message,
  confirmText = "확인",
  onConfirmAction,
  children,
  hideHeader = false,
}: MyPopupMsgProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirmAction && onConfirmAction();
        onCloseAction();
      }
    };

    // 팝업이 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirmAction, onCloseAction]);

  const handleConfirm = () => {
    onConfirmAction && onConfirmAction();
    onCloseAction();
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      title={title}
      titleIcon={GetTitleIcon(msgType)}
      fitContent={true}
      hideHeader={hideHeader}
      alwaysCenter={true}
    >
      <div className="flex flex-col gap-[20px] min-w-[300px]">
        <div className="flex-1 flex flex-col gap-2 px-2 py-1">
          {message && (
            <div className="text-base text-[var(--text-primary)] whitespace-pre-line">
              {message}
            </div>
          )}
          {children && children}
        </div>
        <div className="flex justify-end">
          <MyButton onClick={handleConfirm}>
            <div className="flex items-center gap-1">
              {confirmText}
              <span className="text-[10px]">(enter)</span>
            </div>
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}

function GetTitleIcon(msgType: "error" | "warning" | "info" | "success") {
  switch (msgType) {
    case "error":
      return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    case "warning":
      return <ShieldExclamationIcon className="w-5 h-5 text-yellow-500" />;
    case "info":
      return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    case "success":
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
  }
}
