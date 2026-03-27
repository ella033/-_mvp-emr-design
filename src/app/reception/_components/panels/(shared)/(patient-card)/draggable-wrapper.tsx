"use client";

import React, { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * DraggableWrapper (Custom Implementation)
 * 
 * 역할:
 * - 순수 마우스 이벤트로 Drag & Drop 구현
 * - Drag Overlay 지원
 * - ContextMenu 지원
 * - 외부 라이브러리 의존성 없음
 */

interface DraggableWrapperProps {
  // 식별자
  id: string;
  data?: any;
  disabled?: boolean;

  // 드래그 이벤트 콜백
  onDragStart?: (data: any, event: MouseEvent) => void;
  onDragMove?: (data: any, position: Position) => void;
  onDragEnd?: (data: any, position: Position, event: MouseEvent) => void;

  // Overlay 커스터마이징
  dragOverlay?: React.ReactNode;
  showOverlay?: boolean;
  dragThreshold?: number; // 드래그로 인식할 최소 이동 거리 (px)

  // ContextMenu
  contextMenuItems?: ContextMenuItem[];
  onContextMenuAction?: (action: string, data: any) => void;
  onContextMenuVisibilityChange?: (visible: boolean) => void;

  // UI
  children: React.ReactNode;
  className?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  visible?: boolean;
  divider?: boolean;
}

export interface Position {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export default function DraggableWrapper({
  id,
  data,
  disabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  dragOverlay,
  showOverlay = true,
  dragThreshold = 5,
  contextMenuItems = [],
  onContextMenuAction,
  onContextMenuVisibilityChange,
  children,
  className = "",
}: DraggableWrapperProps) {

  // ===== REFS =====
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const callbacksRef = useRef({ onDragStart, onDragMove, onDragEnd, data });

  // ===== DRAG STATE =====
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startPos: Position | null;
    currentPos: Position | null;
    offset: { x: number; y: number } | null;
    cardWidth: number | null;
    cardHeight: number | null;
  }>({
    isDragging: false,
    startPos: null,
    currentPos: null,
    offset: null,
    cardWidth: null,
    cardHeight: null,
  });

  // 콜백 ref 업데이트
  React.useEffect(() => {
    callbacksRef.current = { onDragStart, onDragMove, onDragEnd, data };
  }, [onDragStart, onDragMove, onDragEnd, data]);

  // ===== CONTEXT MENU STATE =====
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // ===== DRAG HANDLERS =====

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 우클릭이나 disabled 상태면 무시
    if (e.button !== 0 || disabled) return;

    // 컨텍스트 메뉴 클릭은 무시
    const target = e.target as Element;
    if (target.closest('[data-context-menu]')) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // 드래그 시작 위치 저장
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
    };

    const position: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
    };

    // 초기 상태 설정 (아직 isDragging은 false)
    setDragState({
      isDragging: false,
      startPos: position,
      currentPos: position,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
      cardWidth: rect.width,
      cardHeight: rect.height,
    });

    // 전역 이벤트 리스너 등록
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp as any);
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartPos.current) return;

    // 드래그 threshold 체크
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
    };

    // threshold를 넘었고 아직 dragging이 시작되지 않았다면
    if (distance >= dragThreshold && !isDraggingRef.current) {
      isDraggingRef.current = true;
      callbacksRef.current.onDragStart?.(callbacksRef.current.data, e);

      setDragState(prev => ({
        ...prev,
        isDragging: true,
        currentPos: position,
      }));
      return;
    }

    // 이미 dragging 중이라면 위치만 업데이트
    if (isDraggingRef.current) {
      callbacksRef.current.onDragMove?.(callbacksRef.current.data, position);

      setDragState(prev => ({
        ...prev,
        currentPos: position,
      }));
    }
  }, [dragThreshold]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // 전역 이벤트 리스너 제거
    document.removeEventListener('mousemove', handleMouseMove as any);
    document.removeEventListener('mouseup', handleMouseUp as any);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      dragStartPos.current = null;
      isDraggingRef.current = false;
      setDragState({
        isDragging: false,
        startPos: null,
        currentPos: null,
        offset: null,
        cardWidth: null,
        cardHeight: null,
      });
      return;
    }

    const position: Position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      clientX: e.clientX,
      clientY: e.clientY,
      pageX: e.pageX,
      pageY: e.pageY,
    };

    // 실제로 드래그가 발생했다면 onDragEnd 호출
    if (isDraggingRef.current) {
      callbacksRef.current.onDragEnd?.(callbacksRef.current.data, position, e);
    }

    // 상태 초기화
    dragStartPos.current = null;
    isDraggingRef.current = false;
    setDragState({
      isDragging: false,
      startPos: null,
      currentPos: null,
      offset: null,
      cardWidth: null,
      cardHeight: null,
    });
  }, [handleMouseMove]);

  // ===== CONTEXT MENU HANDLERS =====

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (contextMenuItems.length === 0) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
    });
    onContextMenuVisibilityChange?.(true);
  }, [contextMenuItems.length, onContextMenuVisibilityChange]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    onContextMenuVisibilityChange?.(false);
  }, [onContextMenuVisibilityChange]);

  const handleContextMenuItemClick = useCallback((item: ContextMenuItem) => {
    if (item.disabled) return;
    onContextMenuAction?.(item.id, data);
    closeContextMenu();
  }, [onContextMenuAction, data, closeContextMenu]);

  // ===== EFFECTS =====

  // 컨텍스트 메뉴 외부 클릭 감지
  React.useEffect(() => {
    if (contextMenu.visible) {
      const handleClickOutside = (e: MouseEvent): void => {
        const target = e.target as Element;
        const contextMenuElement = document.querySelector('[data-context-menu]');
        if (contextMenuElement && contextMenuElement.contains(target)) {
          return;
        }
        closeContextMenu();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeContextMenu();
        }
      };

      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contextMenu.visible, closeContextMenu]);



  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  React.useEffect(() => {
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp as any);
    };

    return cleanup;
  }, [handleMouseMove, handleMouseUp]);

  // ===== RENDER =====

  const cursor = disabled
    ? 'cursor-not-allowed'
    : dragState.isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab';

  return (
    <>
      {/* Draggable Container */}
      <div
        ref={containerRef}
        className={`
          select-none
          transition-opacity duration-200
          ${dragState.isDragging ? 'opacity-50' : 'opacity-100'}
          ${cursor}
          ${disabled ? 'opacity-50' : ''}
          ${className}
        `}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        {children}
      </div>

      {/* Drag Overlay */}
      {dragState.isDragging && showOverlay && dragState.currentPos && dragState.offset && typeof window !== "undefined"
        ? createPortal(
          <DragOverlay
            position={dragState.currentPos}
            offset={dragState.offset}
            cardWidth={dragState.cardWidth}
            cardHeight={dragState.cardHeight}
          >
            {dragOverlay || children}
          </DragOverlay>,
          document.body
        )
        : null}

      {/* Context Menu */}
      {contextMenu.visible && contextMenuItems.length > 0 && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onItemClick={handleContextMenuItemClick}
        />
      )}
    </>
  );
}

// ===== DRAG OVERLAY COMPONENT =====

interface DragOverlayProps {
  position: Position;
  offset: { x: number; y: number };
  cardWidth?: number | null;
  cardHeight?: number | null;
  children: React.ReactNode;
}

function DragOverlay({ position, offset, cardWidth, cardHeight, children }: DragOverlayProps) {
  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: position.clientX - offset.x,
        top: position.clientY - offset.y,
        height: cardHeight ? `${cardHeight}px` : undefined,
      }}
    >
      <div className="shadow-2xl opacity-95 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ===== CONTEXT MENU COMPONENT =====

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onItemClick: (item: ContextMenuItem) => void;
}

function ContextMenu({ x, y, items, onItemClick }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  React.useEffect(() => {
    if (!menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let adjustedX = x;
    let adjustedY = y;

    // 오른쪽으로 벗어나면 왼쪽으로 이동
    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10;
    }

    // 아래쪽으로 벗어나면 위쪽으로 표시
    if (y + menuRect.height > viewportHeight) {
      adjustedY = y - menuRect.height;
      // 위쪽으로도 벗어나면 화면 안에 맞춤
      if (adjustedY < 0) {
        adjustedY = 10;
      }
    }

    setPosition({ left: adjustedX, top: adjustedY });
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      data-context-menu
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      {items
        .filter((item) => item.visible !== false) // visible이 false가 아닌 경우만 표시 (기본값: true)
        .map((item) => {
          // visible 필터링 후 divider를 위한 이전 아이템 인덱스 계산
          const visibleItems = items.filter((i) => i.visible !== false);
          const visibleIndex = visibleItems.indexOf(item);

          return (
            <React.Fragment key={item.id}>
              {item.divider && visibleIndex > 0 && (
                <div className="border-t border-gray-100 my-1" />
              )}
              <button
                className={`
                  w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => onItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
    </div>
  );
}