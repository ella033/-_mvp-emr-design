"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableLayoutProps {
  items: string[];
  onReorder: (newOrder: string[]) => void;
  children: React.ReactNode[];
  isEditMode: boolean;
}

/**
 * 드래그&드롭으로 카드 모듈 순서 변경
 * 편집 모드일 때 드래그 핸들 표시
 */
export function DraggableLayout({ items, onReorder, children, isEditMode }: DraggableLayoutProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        <div className="flex w-full gap-[6px] h-full min-h-0">
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * 개별 드래그 가능 카드 래퍼
 */
export function SortableCard({
  id,
  isEditMode,
  children,
}: {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }} className="relative">
      {/* 편집 모드 드래그 핸들 */}
      {isEditMode && (
        <div
          className="absolute left-0 top-0 z-30 flex h-[32px] w-[20px] items-center justify-center cursor-grab active:cursor-grabbing bg-[#7C5CFA]/10 rounded-l-[6px]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-[12px] w-[12px] text-[#7C5CFA]" />
        </div>
      )}
      {children}
    </div>
  );
}
