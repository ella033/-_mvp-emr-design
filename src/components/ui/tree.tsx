"use client";

import React, { useState, useRef, useEffect } from "react";
import { Folder, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// 트리 노드 타입 정의
export interface TreeNode {
  id: number;
  name: string;
  isFolder: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
}

// 드래그 앤 드롭 관련 타입
export interface DragDropInfo {
  draggedNodeId: number;
  targetNodeId: number;
  dropPosition: 'before' | 'after' | 'inside';
}

export interface DragDropResult {
  draggedNode: TreeNode;
  targetNode: TreeNode;
  dropPosition: 'before' | 'after' | 'inside';
}

// 트리 아이템 컴포넌트
interface TreeItemProps {
  node: TreeNode;
  level: number;
  onToggle?: (nodeId: number) => void;
  onSelect?: (node: TreeNode) => void;
  selectedId?: number;
  onContextMenu?: (node: TreeNode, event: React.MouseEvent) => void;
  editable?: boolean;
  editingNodeId?: number | null;
  onStartEdit?: (nodeId: number) => void;
  onFinishEdit?: (nodeId: number, newName: string) => void;
  onCancelEdit?: () => void;
  draggable?: boolean;
  allowNestedFolders?: boolean;
  draggedNodeId?: number | null;
  dragOverInfo?: { nodeId: number; position: 'before' | 'after' | 'inside' } | null;
  onDragStart?: (node: TreeNode) => void;
  onDragEnd?: () => void;
  onDragOver?: (node: TreeNode, event: React.DragEvent, position: 'before' | 'after' | 'inside') => void;
  onDrop?: (targetNode: TreeNode, position: 'before' | 'after' | 'inside') => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  onToggle,
  onSelect,
  selectedId,
  onContextMenu,
  editable,
  editingNodeId,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  draggable = false,
  allowNestedFolders = true,
  draggedNodeId,
  dragOverInfo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isExpanded = node.isExpanded ?? true;
  const isEditing = editingNodeId === node.id;
  const [editValue, setEditValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const isDragging = draggedNodeId === node.id;
  const isDragOver = dragOverInfo?.nodeId === node.id;

  // 편집 모드일 때 input에 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 편집 모드 시작
  const handleDoubleClick = (event: React.MouseEvent) => {
    if (editable && onStartEdit) {
      event.stopPropagation();
      setEditValue(node.name);
      onStartEdit(node.id);
    }
  };

  // 편집 완료
  const handleEditComplete = () => {
    if (editValue.trim() && editValue !== node.name && onFinishEdit) {
      onFinishEdit(node.id, editValue.trim());
    } else if (onCancelEdit) {
      onCancelEdit();
    }
  };

  // 편집 취소
  const handleEditCancel = () => {
    setEditValue(node.name);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleEditComplete();
    } else if (event.key === "Escape") {
      event.preventDefault();
      handleEditCancel();
    }
  };

  const handleToggle = () => {
    if (hasChildren && onToggle) {
      onToggle(node.id);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(node);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // 우클릭 시 노드 선택
    if (onSelect) {
      onSelect(node);
    }

    // 컨텍스트 메뉴 표시
    if (onContextMenu) {
      onContextMenu(node, event);
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (event: React.DragEvent) => {
    if (!draggable) return;
    event.stopPropagation();
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', node.id.toString());
    if (onDragStart) {
      onDragStart(node);
    }
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (event: React.DragEvent) => {
    if (!draggable) return;
    event.stopPropagation();
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // 드래그 오버 핸들러
  const handleDragOver = (event: React.DragEvent) => {
    if (!draggable || !onDragOver) return;
    event.preventDefault();
    event.stopPropagation();

    // 드래그 중인 노드가 자기 자신인 경우 방지
    if (draggedNodeId === node.id) {
      return;
    }

    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseY = event.clientY - rect.top;
    const height = rect.height;
    const threshold = height / 3;

    let position: 'before' | 'after' | 'inside';

    if (node.isFolder) {
      // 폴더인 경우: before / inside / after
      if (mouseY < threshold) {
        position = 'before';
      } else if (mouseY > height - threshold) {
        position = 'after';
      } else {
        position = 'inside';
      }
    } else {
      // 파일인 경우: before / after
      if (mouseY < height / 2) {
        position = 'before';
      } else {
        position = 'after';
      }
    }

    onDragOver(node, event, position);
  };

  // 드롭 핸들러
  const handleDrop = (event: React.DragEvent) => {
    if (!draggable || !onDrop || !dragOverInfo) return;
    event.preventDefault();
    event.stopPropagation();

    if (dragOverInfo.nodeId === node.id) {
      onDrop(node, dragOverInfo.position);
    }
  };

  return (
    <div className="select-none">
        <div
          ref={itemRef}
          draggable={draggable && !isEditing}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "flex items-center relative rounded-sm transition-all",
            draggable && !isEditing && "cursor-move",
            !draggable && "cursor-pointer",
            node.isFolder && "hover:bg-[var(--bg-1)]",
            node.isFolder && isSelected && "bg-[var(--bg-1)]",
            isDragging && "opacity-50",
            isDragOver && dragOverInfo?.position === 'inside' && "bg-blue-50 border-2 border-blue-400"
          )}
          style={{
            minHeight: "28px",
          }}
          onClick={node.isFolder ? handleSelect : undefined}
          onContextMenu={handleContextMenu}
        >
          {/* 드롭 인디케이터 - before */}
          {isDragOver && dragOverInfo?.position === 'before' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />
          )}
          
          {/* 드롭 인디케이터 - after */}
          {isDragOver && dragOverInfo?.position === 'after' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50" />
          )}
          {/* 좌측 아이콘/라인 영역 (고정 24px) */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: "24px",
              marginLeft: `${level * 10}px`,
            }}
          >
            {/* 파일 연결선 표시 (가로 선) */}
            {level > 0 && (
              <div
                className="absolute top-1/2 border-t border-[var(--gray-600)]"
                style={{
                  left: `${level * 10 - 8}px`,
                  width: "10px",
                }}
              />
            )}

            {/* 폴더 아이콘 */}
            {node.isFolder && (
              <button
                onClick={(e) => {
                  if (hasChildren) {
                    e.stopPropagation();
                    handleToggle();
                  }
                }}
                className="flex items-center justify-center w-4 h-4 rounded-sm hover:bg-[var(--bg-0)] transition-colors z-10"
                style={{
                  marginLeft: `${level * 20}px`,
                  cursor: hasChildren ? 'pointer' : 'default',
                }}
              >
                <Folder className="w-4 h-4 text-[var(--gray-300)]" />
              </button>
            )}
          </div>

          {/* 폴더/파일 타이틀 영역 */}
          {node.isFolder ? (
            <div className="flex items-center flex-1">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditComplete}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "text-sm flex-1 px-2 py-0.5 rounded",
                    "border border-[var(--main-color)] outline-none",
                    "bg-white text-[var(--fg-main)]"
                  )}
                  style={{
                    marginLeft: `${level * 10 + 5}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    "text-sm flex-1 truncate text-[var(--fg-main)]",
                    isSelected && "font-medium"
                  )}
                  style={{
                    marginLeft: `${level * 10 + 5}px`,
                  }}
                  onDoubleClick={handleDoubleClick}
                >
                  {node.name}
                </span>
              )}

              {/* 선택된 경우 체크 아이콘 */}
              {!isEditing && isSelected && (
                <div className="flex items-center justify-center w-4 h-4 ml-2 mr-2">
                  <Check className="w-4 h-4 text-[var(--gray-300)]" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center flex-1 rounded-sm cursor-pointer transition-colors py-1 px-2",
                "hover:bg-[var(--bg-1)]",
                isSelected && "bg-[var(--bg-1)]"
              )}
              onClick={handleSelect}
              onContextMenu={handleContextMenu}
              onDoubleClick={handleDoubleClick}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleEditComplete}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "text-sm flex-1 px-2 py-0.5 rounded",
                    "border border-[var(--main-color)] outline-none",
                    "bg-white text-[var(--fg-main)]"
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className={cn(
                    "text-sm flex-1 truncate text-[var(--fg-main)]",
                    isSelected && "font-medium"
                  )}
                >
                  {node.name}
                </span>
              )}

              {/* 선택된 경우 체크 아이콘 */}
              {!isEditing && isSelected && (
                <div className="flex items-center justify-center w-4 h-4 ml-2">
                  <Check className="w-4 h-4 text-[var(--gray-300)]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 자식 노드들 */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* 세로 연결선 */}
            <div
              className="absolute border-l border-[var(--gray-600)]"
              style={{
                left: `${level * 20 + 12}px`,
                top: "0px",
                bottom: "14px",
              }}
            />
            {node.children?.map((child) => (
              <div key={child.id} className="relative">
                <TreeItem
                  node={child}
                  level={level + 1}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  onContextMenu={onContextMenu}
                  editable={editable}
                  editingNodeId={editingNodeId}
                  onStartEdit={onStartEdit}
                  onFinishEdit={onFinishEdit}
                  onCancelEdit={onCancelEdit}
                  draggable={draggable}
                  allowNestedFolders={allowNestedFolders}
                  draggedNodeId={draggedNodeId}
                  dragOverInfo={dragOverInfo}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                />
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

// 메인 트리 컴포넌트
interface TreeProps {
  data: TreeNode[];
  onNodeToggle?: (nodeId: number) => void;
  onNodeSelect?: (node: TreeNode) => void;
  selectedNodeId?: number;
  className?: string;
  emptyContent?: React.ReactNode;
  onNodeContextMenu?: (node: TreeNode, event: React.MouseEvent) => void;
  editable?: boolean;
  onNodeRename?: (nodeId: number, newName: string) => void;
  editingNodeId?: number | null;
  onEditingNodeIdChange?: (nodeId: number | null) => void;
  draggable?: boolean;
  allowNestedFolders?: boolean;
  onNodeDrop?: (result: DragDropResult) => void;
}

export const Tree: React.FC<TreeProps> = ({
  data,
  onNodeToggle,
  onNodeSelect,
  selectedNodeId,
  className,
  emptyContent,
  onNodeContextMenu,
  editable = false,
  onNodeRename,
  editingNodeId: controlledEditingNodeId,
  onEditingNodeIdChange,
  draggable = false,
  allowNestedFolders = true,
  onNodeDrop,
}) => {
  // Controlled vs Uncontrolled 패턴 지원
  const [internalEditingNodeId, setInternalEditingNodeId] = useState<
    number | null
  >(null);
  const isControlled = controlledEditingNodeId !== undefined;
  const editingNodeId = isControlled
    ? controlledEditingNodeId
    : internalEditingNodeId;

  // 드래그 앤 드롭 상태
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ nodeId: number; position: 'before' | 'after' | 'inside' } | null>(null);

  const handleStartEdit = (nodeId: number) => {
    if (isControlled) {
      onEditingNodeIdChange?.(nodeId);
    } else {
      setInternalEditingNodeId(nodeId);
    }
  };

  const handleFinishEdit = (nodeId: number, newName: string) => {
    if (onNodeRename) {
      onNodeRename(nodeId, newName);
    }
    if (isControlled) {
      onEditingNodeIdChange?.(null);
    } else {
      setInternalEditingNodeId(null);
    }
  };

  const handleCancelEdit = () => {
    if (isControlled) {
      onEditingNodeIdChange?.(null);
    } else {
      setInternalEditingNodeId(null);
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (node: TreeNode) => {
    setDraggedNode(node);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDraggedNode(null);
    setDragOverInfo(null);
  };

  // 드래그 오버 핸들러
  const handleDragOver = (
    targetNode: TreeNode,
    _event: React.DragEvent,
    position: 'before' | 'after' | 'inside'
  ) => {
    if (!draggedNode) return;

    // 자기 자신 위로 드래그하는 경우 방지
    if (draggedNode.id === targetNode.id) {
      setDragOverInfo(null);
      return;
    }

    // 폴더를 다른 폴더 안으로 드래그하는 경우 allowNestedFolders 확인
    if (!allowNestedFolders && draggedNode.isFolder && targetNode.isFolder && position === 'inside') {
      setDragOverInfo(null);
      return;
    }

    // 자식을 부모로 드래그하는 경우 방지 (순환 참조 방지)
    if (isDescendant(targetNode, draggedNode.id, data)) {
      setDragOverInfo(null);
      return;
    }

    setDragOverInfo({ nodeId: targetNode.id, position });
  };

  // 드롭 핸들러
  const handleDrop = (targetNode: TreeNode, position: 'before' | 'after' | 'inside') => {
    if (!draggedNode || !onNodeDrop) {
      setDraggedNode(null);
      setDragOverInfo(null);
      return;
    }

    // 자기 자신 위로 드롭하는 경우 방지
    if (draggedNode.id === targetNode.id) {
      setDraggedNode(null);
      setDragOverInfo(null);
      return;
    }

    // 폴더를 다른 폴더 안으로 드롭하는 경우 allowNestedFolders 확인
    if (!allowNestedFolders && draggedNode.isFolder && targetNode.isFolder && position === 'inside') {
      setDraggedNode(null);
      setDragOverInfo(null);
      return;
    }

    // 자식을 부모로 드롭하는 경우 방지 (순환 참조 방지)
    if (isDescendant(targetNode, draggedNode.id, data)) {
      setDraggedNode(null);
      setDragOverInfo(null);
      return;
    }

    onNodeDrop({
      draggedNode,
      targetNode,
      dropPosition: position,
    });

    setDraggedNode(null);
    setDragOverInfo(null);
  };

  // 노드가 다른 노드의 자손인지 확인하는 헬퍼 함수
  const isDescendant = (ancestor: TreeNode, descendantId: number, nodes: TreeNode[]): boolean => {
    const findNode = (nodes: TreeNode[], id: number): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const checkDescendant = (node: TreeNode, targetId: number): boolean => {
      if (node.id === targetId) return true;
      if (node.children) {
        return node.children.some((child) => checkDescendant(child, targetId));
      }
      return false;
    };

    const ancestorNode = findNode(nodes, ancestor.id);
    if (!ancestorNode) return false;

    return checkDescendant(ancestorNode, descendantId);
  };

  // 데이터가 없는 경우 빈 상태 표시
  if (!data || data.length === 0) {
    return (
      <div className={cn("w-full flex items-center justify-center", className)}>
        <div className="text-center text-sm text-[var(--gray-400)]">
          {emptyContent || "표시할 데이터가 없습니다"}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-0">
        {data.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            level={0}
            onToggle={onNodeToggle}
            onSelect={onNodeSelect}
            selectedId={selectedNodeId}
            onContextMenu={onNodeContextMenu}
            editable={editable}
            editingNodeId={editingNodeId}
            onStartEdit={handleStartEdit}
            onFinishEdit={handleFinishEdit}
            onCancelEdit={handleCancelEdit}
            draggable={draggable}
            allowNestedFolders={allowNestedFolders}
            draggedNodeId={draggedNode?.id ?? null}
            dragOverInfo={dragOverInfo}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default Tree;
