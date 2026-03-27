'use client';

import React from 'react';
import { Rect, Text, Group, Line } from 'react-konva';
import type { AddedField } from '@/types/document';

const DIAGNOSIS_TABLE_MIN_COLUMN_RATIO = 0.1;

interface DiagnosisTableFieldProps {
  field: AddedField;
  isSelected: boolean;
  isMultiSelected: boolean;
  // 컬럼 리사이징 상태
  isResizingColumn: boolean;
  resizingFieldKey: string | null;
  resizingNameColumnRatio: number | null; // 리사이징 중인 상병명 컬럼 비율
  resizingCodeColumnStartRatio: number | null; // 리사이징 중인 분류기호 컬럼 시작 비율
  // 컬럼 리사이징 상태 설정 함수
  setIsResizingColumn: (value: boolean) => void;
  setResizingFieldKey: (value: string | null) => void;
  setResizeStartX: (value: number) => void;
  setResizingNameColumnRatio: (value: number | null) => void;
  setResizingCodeColumnStartRatio: (value: number | null) => void;
  // ref 콜백
  fieldRef: (node: any) => void;
  labelTextRef: (node: any) => void;
  // 라벨 너비
  labelWidth: number | undefined;
  // 이벤트 핸들러
  handleFieldClick: (e: any, field: AddedField) => void;
  handleDragStart: (e: any, field: AddedField) => void;
  handleDragMove: (e: any, field: AddedField) => void;
  handleDragEnd: (e: any, field: AddedField) => void;
  handleTransformEnd: (e: any, field: AddedField) => void;
}

export function DiagnosisTableField({
  field,
  isSelected,
  isMultiSelected,
  isResizingColumn,
  resizingFieldKey,
  resizingNameColumnRatio,
  resizingCodeColumnStartRatio,
  setIsResizingColumn,
  setResizingFieldKey,
  setResizeStartX,
  setResizingNameColumnRatio,
  setResizingCodeColumnStartRatio,
  fieldRef,
  labelTextRef,
  labelWidth,
  handleFieldClick,
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  handleTransformEnd,
}: DiagnosisTableFieldProps) {
  const tableOptions = field.options?.diagnosisTable;

  if (!tableOptions || typeof tableOptions.nameColumnRatio !== 'number') {
    return null;
  }

  const nameColumnRatio = tableOptions.nameColumnRatio;
  const codeColumnStartRatio = tableOptions.codeColumnStartRatio ?? nameColumnRatio;

  // 현재 리사이징 중인 경우 실시간 업데이트
  const isCurrentFieldResizing = isResizingColumn && resizingFieldKey === field.key;
  const currentNameRatio = isCurrentFieldResizing && resizingNameColumnRatio !== null
    ? resizingNameColumnRatio
    : nameColumnRatio;
  const currentCodeStartRatio = isCurrentFieldResizing && resizingCodeColumnStartRatio !== null
    ? resizingCodeColumnStartRatio
    : codeColumnStartRatio;

  // 비율 기반으로 실제 픽셀 너비 계산
  const currentNameWidth = field.width * currentNameRatio;
  const currentCodeStartX = field.width * currentCodeStartRatio;

  const colors = (() => {
    const multi = {
      fill: "rgba(245, 158, 11, 0.22)",
      stroke: "rgba(217, 119, 6, 0.95)",
      cellStroke: "rgba(217, 119, 6, 0.25)",
      nameDividerStroke: isCurrentFieldResizing ? "rgba(217, 119, 6, 1)" : "rgba(217, 119, 6, 0.6)",
      codeDividerStroke: isCurrentFieldResizing ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 0.6)",
    };

    if (isMultiSelected) return multi;

    return {
      fill: isSelected ? "rgba(251, 146, 60, 0.2)" : "rgba(251, 146, 60, 0.15)",
      stroke: isSelected ? "rgba(251, 146, 60, 0.9)" : "rgba(251, 146, 60, 0.7)",
      cellStroke: "rgba(251, 146, 60, 0.3)",
      nameDividerStroke: isCurrentFieldResizing ? "rgba(251, 146, 60, 1)" : "rgba(251, 146, 60, 0.5)",
      codeDividerStroke: isCurrentFieldResizing ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 0.5)",
    };
  })();

  const nameDividerX = field.x + currentNameWidth;
  const codeDividerX = field.x + currentCodeStartX;

  return (
    <React.Fragment>
      {/* 테이블 배경 */}
      <Group draggable={false}>
        <Rect
          x={field.x}
          y={field.y}
          width={field.width}
          height={field.height}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={isSelected || isMultiSelected ? 3 : 2}
          listening={false}
        />
      </Group>

      {/* 필드 영역 (드래그/리사이즈용) */}
      <Rect
        ref={fieldRef}
        x={field.x}
        y={field.y}
        width={field.width}
        height={field.height}
        fill="transparent"
        stroke={isMultiSelected ? "rgba(59, 130, 246, 0.9)" : (isSelected ? "rgba(251, 146, 60, 0.9)" : "rgba(251, 146, 60, 0.7)")}
        strokeWidth={isSelected || isMultiSelected ? 3 : 2}
        draggable
        onClick={(e) => handleFieldClick(e, field)}
        onTap={(e) => handleFieldClick(e, field)}
        onDragStart={(e) => handleDragStart(e, field)}
        onDragMove={(e) => handleDragMove(e, field)}
        onDragEnd={(e) => handleDragEnd(e, field)}
        onTransformEnd={(e) => handleTransformEnd(e, field)}
      />

      {/* 상병명 끝 구분선 (왼쪽 divider, 오렌지) */}
      <ColumnDivider
        field={field}
        label="상병명 끝"
        labelColor="rgba(251, 146, 60, 0.95)"
        currentDividerX={nameDividerX}
        dividerStroke={colors.nameDividerStroke}
        isCurrentFieldResizing={isCurrentFieldResizing && resizingNameColumnRatio !== null}
        storedRatio={nameColumnRatio}
        minRatio={DIAGNOSIS_TABLE_MIN_COLUMN_RATIO}
        maxRatio={currentCodeStartRatio}
        setIsResizingColumn={setIsResizingColumn}
        setResizingFieldKey={setResizingFieldKey}
        setResizeStartX={setResizeStartX}
        setResizingRatio={setResizingNameColumnRatio}
      />

      {/* 분류기호 시작 구분선 (오른쪽 divider, 파란색) — 항상 표시 */}
      <ColumnDivider
        field={field}
        label="분류기호 시작"
        labelColor="rgba(59, 130, 246, 0.95)"
        currentDividerX={codeDividerX}
        dividerStroke={colors.codeDividerStroke}
        isCurrentFieldResizing={isCurrentFieldResizing && resizingCodeColumnStartRatio !== null}
        storedRatio={codeColumnStartRatio}
        minRatio={currentNameRatio}
        maxRatio={1 - DIAGNOSIS_TABLE_MIN_COLUMN_RATIO}
        setIsResizingColumn={setIsResizingColumn}
        setResizingFieldKey={setResizingFieldKey}
        setResizeStartX={setResizeStartX}
        setResizingRatio={setResizingCodeColumnStartRatio}
      />

      {/* 필드 라벨 */}
      <Group
        x={field.x}
        y={field.y - 14}
        listening={false}
      >
        <Rect
          x={0}
          y={0}
          width={labelWidth || field.name.length * 7 + 12}
          height={16}
          fill="rgba(251, 146, 60, 0.95)"
          cornerRadius={6}
          shadowColor="rgba(15, 23, 42, 0.25)"
          shadowBlur={2}
          shadowOffsetY={1}
          listening={false}
        />
        <Text
          ref={labelTextRef}
          x={6}
          y={0}
          text={field.name}
          fontSize={12}
          fontStyle="bold"
          fill="#ffffff"
          height={16}
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    </React.Fragment>
  );
}

// 컬럼 구분선 서브 컴포넌트
interface ColumnDividerProps {
  field: AddedField;
  label: string;
  labelColor: string;
  currentDividerX: number;
  dividerStroke: string;
  isCurrentFieldResizing: boolean;
  storedRatio: number;
  minRatio: number;
  maxRatio: number;
  setIsResizingColumn: (value: boolean) => void;
  setResizingFieldKey: (value: string | null) => void;
  setResizeStartX: (value: number) => void;
  setResizingRatio: (value: number | null) => void;
}

const DIVIDER_LABEL_HEIGHT = 14;
const DIVIDER_LABEL_FONT_SIZE = 10;
const DIVIDER_LABEL_PADDING_X = 5;

function ColumnDivider({
  field,
  label,
  labelColor,
  currentDividerX,
  dividerStroke,
  isCurrentFieldResizing,
  storedRatio,
  minRatio,
  maxRatio,
  setIsResizingColumn,
  setResizingFieldKey,
  setResizeStartX,
  setResizingRatio,
}: ColumnDividerProps) {
  const labelWidth = label.length * 8 + DIVIDER_LABEL_PADDING_X * 2;
  const labelX = currentDividerX - labelWidth / 2;
  const labelY = field.y - DIVIDER_LABEL_HEIGHT - 2;

  return (
    <React.Fragment>
      {/* 라벨 (divider 상단에 표시) */}
      <Rect
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={DIVIDER_LABEL_HEIGHT}
        fill={labelColor}
        cornerRadius={4}
        listening={false}
      />
      <Text
        x={labelX + DIVIDER_LABEL_PADDING_X}
        y={labelY}
        text={label}
        fontSize={DIVIDER_LABEL_FONT_SIZE}
        fontStyle="bold"
        fill="#ffffff"
        height={DIVIDER_LABEL_HEIGHT}
        verticalAlign="middle"
        listening={false}
      />

      {/* 구분선 */}
      <Line
        points={[currentDividerX, field.y, currentDividerX, field.y + field.height]}
        stroke={dividerStroke}
        strokeWidth={isCurrentFieldResizing ? 3 : 2}
        hitStrokeWidth={20}
        lineCap="round"
        draggable={true}
        dragBoundFunc={() => ({
          x: 0,
          y: 0,
        })}
        onMouseDown={(e) => {
          e.cancelBubble = true;
          setIsResizingColumn(true);
          setResizingFieldKey(field.key);
          const stage = e.target.getStage();
          const pointerPos = stage?.getPointerPosition();
          if (pointerPos) {
            setResizeStartX(pointerPos.x);
            setResizingRatio(storedRatio);
          }
        }}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'col-resize';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrentFieldResizing) {
            const stage = e.target.getStage();
            if (stage) {
              stage.container().style.cursor = 'default';
            }
          }
        }}
        onDragMove={(e) => {
          const stage = e.target.getStage();
          const pointerPos = stage?.getPointerPosition();
          if (!pointerPos) return;

          const dividerXInField = pointerPos.x - field.x;
          const newRatio = dividerXInField / field.width;
          const clampedRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
          setResizingRatio(clampedRatio);
        }}
      />
    </React.Fragment>
  );
}
