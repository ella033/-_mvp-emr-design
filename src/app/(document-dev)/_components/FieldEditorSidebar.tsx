'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFieldEditor } from '../_contexts/FieldEditorContext';
import { FieldType, type AddedField } from '@/types/document';

export default function FieldEditorSidebar() {
  const {
    addedFields,
    currentPage,
    numPages,
    selectedField,
    setSelectedField,
    reorderFields,
    deleteField,
  } = useFieldEditor();

  // 확장된 페이지 상태 (기본적으로 현재 페이지가 확장됨)
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([1]));

  // 페이지별로 필드를 그룹화하고 order 순으로 정렬
  const fieldsByPage = useMemo(() => {
    const grouped = new Map<number, AddedField[]>();
    
    addedFields.forEach((field) => {
      const page = field.pageNumber;
      if (!grouped.has(page)) {
        grouped.set(page, []);
      }
      grouped.get(page)!.push(field);
    });

    // 각 페이지의 필드들을 order 순으로 정렬
    grouped.forEach((fields, page) => {
      fields.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [addedFields]);

  // 모든 페이지 번호 (정렬됨)
  const pageNumbers = useMemo(() => {
    const pages = Array.from(fieldsByPage.keys()).sort((a, b) => a - b);
    // numPages가 있으면 모든 페이지를 포함
    if (numPages) {
      for (let i = 1; i <= numPages; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      pages.sort((a, b) => a - b);
    }
    return pages;
  }, [fieldsByPage, numPages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, pageNumber: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const pageFields = fieldsByPage.get(pageNumber) || [];
      const oldIndex = pageFields.findIndex((f) => f.key === active.id);
      const newIndex = pageFields.findIndex((f) => f.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(pageFields, oldIndex, newIndex);
        const orderedKeys = reorderedFields.map((f) => f.key);
        reorderFields(pageNumber, orderedKeys);
      }
    }
  };

  const togglePageExpanded = (page: number) => {
    setExpandedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(page)) {
        newSet.delete(page);
      } else {
        newSet.add(page);
      }
      return newSet;
    });
  };

  const handleFieldClick = (field: AddedField) => {
    setSelectedField(field);
  };

  const handleDeleteField = (e: React.MouseEvent, fieldKey: string) => {
    e.stopPropagation();
    deleteField(fieldKey);
  };

  const totalFieldCount = addedFields.length;

  return (
    <div className="w-72 h-full border-r border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">필드 목록</h2>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {totalFieldCount}개
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          드래그하여 순서를 변경할 수 있습니다
        </p>
      </div>

      {/* 필드 목록 */}
      <div className="flex-1 p-2">
        {pageNumbers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg
              className="w-12 h-12 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">추가된 필드가 없습니다</p>
            <p className="text-xs mt-1">PDF에서 우클릭하여 필드를 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pageNumbers.map((pageNumber) => {
              const pageFields = fieldsByPage.get(pageNumber) || [];
              const isExpanded = expandedPages.has(pageNumber);
              const isCurrentPage = pageNumber === currentPage;

              return (
                <div
                  key={pageNumber}
                  className={`rounded-lg overflow-hidden border ${
                    isCurrentPage
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* 페이지 헤더 */}
                  <button
                    onClick={() => togglePageExpanded(pageNumber)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors ${
                      isCurrentPage
                        ? 'text-blue-700 hover:bg-blue-100/50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span>페이지 {pageNumber}</span>
                      {isCurrentPage && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded">
                          현재
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        isCurrentPage
                          ? 'bg-blue-200 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageFields.length}
                    </span>
                  </button>

                  {/* 필드 목록 */}
                  {isExpanded && (
                    <div className="px-2 pb-2">
                      {pageFields.length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">
                          필드 없음
                        </div>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, pageNumber)}
                        >
                          <SortableContext
                            items={pageFields.map((f) => f.key)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1">
                              {pageFields.map((field, index) => (
                                <SortableFieldItem
                                  key={field.key}
                                  field={field}
                                  index={index}
                                  isSelected={selectedField?.key === field.key}
                                  onClick={() => handleFieldClick(field)}
                                  onDelete={(e) => handleDeleteField(e, field.key)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 드래그 가능한 필드 아이템 컴포넌트
interface SortableFieldItemProps {
  field: AddedField;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableFieldItem({
  field,
  index,
  isSelected,
  onClick,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo = getFieldTypeInfo(field.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all
        ${isDragging ? 'opacity-50 z-50 shadow-lg' : ''}
        ${isSelected
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }
      `}
      onClick={onClick}
    >
      {/* 드래그 핸들 */}
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing p-1 rounded hover:bg-black/10 ${
          isSelected ? 'text-white/70' : 'text-gray-400'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm8-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>

      {/* 순서 번호 */}
      <span
        className={`w-5 h-5 flex items-center justify-center text-[10px] font-medium rounded ${
          isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {index + 1}
      </span>

      {/* 타입 아이콘 */}
      <span
        className={`w-5 h-5 flex items-center justify-center text-xs rounded ${
          isSelected ? 'bg-white/20' : typeInfo.bgColor
        }`}
        title={typeInfo.label}
      >
        {typeInfo.icon}
      </span>

      {/* 필드명 */}
      <span className="flex-1 text-sm truncate" title={field.name}>
        {field.name}
      </span>

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all ${
          isSelected ? 'text-white/70 opacity-100' : 'text-gray-400'
        }`}
        title="삭제"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// 필드 타입 정보
function getFieldTypeInfo(type: FieldType): {
  label: string;
  icon: string;
  bgColor: string;
} {
  switch (type) {
    case FieldType.TEXT:
      return { label: '텍스트', icon: 'T', bgColor: 'bg-blue-100 text-blue-600' };
    case FieldType.NUMBER:
      return { label: '숫자', icon: '#', bgColor: 'bg-green-100 text-green-600' };
    case FieldType.DATE:
      return { label: '날짜', icon: '📅', bgColor: 'bg-purple-100 text-purple-600' };
    case FieldType.DATETIME:
      return { label: '날짜시간', icon: '🕐', bgColor: 'bg-purple-100 text-purple-600' };
    case FieldType.TEXTAREA:
      return { label: '텍스트영역', icon: '¶', bgColor: 'bg-indigo-100 text-indigo-600' };
    case FieldType.CHECKBOX:
      return { label: '체크박스', icon: '☑', bgColor: 'bg-emerald-100 text-emerald-600' };
    case FieldType.SELECT:
      return { label: '선택', icon: '▼', bgColor: 'bg-cyan-100 text-cyan-600' };
    case FieldType.SIGNATURE:
      return { label: '서명', icon: '✍', bgColor: 'bg-amber-100 text-amber-600' };
    case FieldType.IMAGE:
      return { label: '이미지', icon: '🖼', bgColor: 'bg-pink-100 text-pink-600' };
    case FieldType.STAMP:
      return { label: '직인', icon: '◉', bgColor: 'bg-red-100 text-red-600' };
    case FieldType.DIAGNOSIS_TABLE:
      return { label: '진단테이블', icon: '☰', bgColor: 'bg-orange-100 text-orange-600' };
    default:
      return { label: '알 수 없음', icon: '?', bgColor: 'bg-gray-100 text-gray-600' };
  }
}
