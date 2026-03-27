'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Group, Line } from 'react-konva';
import { useFieldEditor } from '../_contexts/FieldEditorContext';
import type { AddedField, DataItem } from '@/types/document';
import { DiagnosisTableField } from './DiagnosisTableField';
import { CheckboxLabelFormat, FieldType } from '@/types/document';
import { DATA_ITEM_CATEGORIES } from '../_constants/dataItems';

const FIELD_EDITOR_UI = {
  snap: {
    thresholdPx: 5,
    edgeMoveEpsilon: 0.001,
  },
  transform: {
    minSizePx: 5,
    diagnosisTableMinWidthPx: 100,
    diagnosisTableMinHeightPx: 40,
  },
  checkbox: {
    sideLabelGapPx: 6,
    hitPaddingWithoutLabelPx: 6,
    hitPaddingWithLabelPx: 4,
    clipboard: {
      pasteOffsetPx: 12,
    },
    clickArea: {
      dash: [8, 4] as number[],
      strokeWidthPx: 2,
      cornerRadiusPx: 6,
      stroke: {
        multi: "rgba(217, 119, 6, 0.85)",
        selected: "rgba(34, 197, 94, 0.85)",
        withLabel: "rgba(34, 197, 94, 0.70)",
        withoutLabel: "rgba(34, 197, 94, 0.55)",
      },
      fill: {
        multi: "rgba(245, 158, 11, 0.12)",
        selected: "rgba(34, 197, 94, 0.10)",
        withLabel: "rgba(34, 197, 94, 0.07)",
        withoutLabel: "rgba(34, 197, 94, 0.05)",
      },
    },
    hitArea: {
      minWidthPx: 20,
      minHeightPx: 12,
    },
  },
  multiSelect: {
    bboxPaddingPx: 6,
    toolbarOffsetPx: 28,
    toolbarGapPx: 8,
    toolbarInputWidthPx: 68,
    toolbarMinWidthPx: 260,
    toolbarHeightPx: 40,
    toolbarMarginPx: 8,
    driverKey: '__selection_bbox__',
    fill: "rgba(245, 158, 11, 0.22)",
    stroke: "rgba(217, 119, 6, 0.95)",
    labelFill: "rgba(217, 119, 6, 0.95)",
    guideStroke: "rgba(217, 119, 6, 0.9)",
  },
} as const;

interface FieldOverlayProps {
  width: number;
  height: number;
  fields: AddedField[];
  onFieldUpdate?: (field: AddedField) => void;
  onFieldDelete?: (fieldId: string) => void;
}

type ActiveGuides = {
  verticalX: number | null;
  horizontalY: number | null;
};

function FieldOverlay({
  width,
  height,
  fields,
  onFieldUpdate,
}: FieldOverlayProps) {
  const {
    selectedField,
    selectedFields,
    setSelectedField,
    setSelectedFields,
    updateFields,
    setRadioGroup,
    removeRadioGroup,
    setScoreGroup,
    removeScoreGroup,
    deleteFields,
    getRadioGroupColor,
    addedFields,
    numPages,
    addField,
    addFields,
    currentPage,
  } = useFieldEditor();
  const transformerRef = useRef<any>(null);
  const hitAreaTransformerRef = useRef<any>(null);
  const fieldRefs = useRef<{ [key: string]: any }>({});
  const hitAreaRefs = useRef<{ [key: string]: any }>({});
  const labelTextRefs = useRef<{ [key: string]: any }>({});
  const [labelWidths, setLabelWidths] = useState<{ [key: string]: number }>({});
  const [selectedHitAreaFieldKey, setSelectedHitAreaFieldKey] = useState<string | null>(null);
  // 드래그 중인 히트 영역 필드 키 (성능 최적화: 드래그 중에는 별도 레이어에서 렌더링)
  const [draggingHitAreaFieldKey, setDraggingHitAreaFieldKey] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeGuides, setActiveGuides] = useState<ActiveGuides>({ verticalX: null, horizontalY: null });
  const dragStateRef = useRef<{
    fieldKey: string;
    startPointer: { x: number; y: number };
    startNode: { x: number; y: number };
  } | null>(null);
  const suppressNextStageClickRef = useRef<boolean>(false);
  const groupDragStateRef = useRef<{
    driverFieldKey: string;
    fieldKeys: string[];
    startPointer: { x: number; y: number };
    startPositions: Record<string, { x: number; y: number }>;
    startSelectionBox: { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number };
  } | null>(null);
  const isAltPressedRef = useRef<boolean>(false);
  const guideRafRef = useRef<number | null>(null);
  const pendingGuidesRef = useRef<ActiveGuides>({ verticalX: null, horizontalY: null });
  const clipboardRef = useRef<{ fields: AddedField[]; pasteIndex: number } | null>(null);

  // 드래그 박스 선택 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragEndPos, setDragEndPos] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<any>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // 컨텍스트 메뉴 상태
  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    visible: boolean;
    stagePosition?: { x: number; y: number }; // Stage 내 클릭 위치 (필드 추가 시 사용)
  } | null>(null);

  // 필드 추가 서브메뉴 상태
  const [addFieldSubmenuOpen, setAddFieldSubmenuOpen] = useState<string | null>(null); // 열린 카테고리 ID

  // 점수 그룹 설정 다이얼로그 상태
  const [scoreGroupDialogOpen, setScoreGroupDialogOpen] = useState(false);
  const [scoreGroupDialogFields, setScoreGroupDialogFields] = useState<AddedField[]>([]);

  // 컬럼 width 조정 상태
  const [isResizingColumn, setIsResizingColumn] = useState(false);
  const [resizingFieldKey, setResizingFieldKey] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizingNameColumnRatio, setResizingNameColumnRatio] = useState<number | null>(null);
  const [resizingCodeColumnStartRatio, setResizingCodeColumnStartRatio] = useState<number | null>(null);
  const [bulkWidthInput, setBulkWidthInput] = useState<string>('');
  const [bulkHeightInput, setBulkHeightInput] = useState<string>('');
  const [bulkHitPaddingInput, setBulkHitPaddingInput] = useState<string>('');

  // Canvas를 사용한 텍스트 너비 측정 함수
  function measureTextWidth(text: string, fontSize: number, fontStyle: string): number {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const context = canvasRef.current.getContext('2d');
    if (!context) return text.length * 7; // 폴백

    const font = `${fontStyle} ${fontSize}px Arial, sans-serif`;
    context.font = font;
    return context.measureText(text).width;
  }

  // 체크박스 필드인지 확인하는 헬퍼 함수
  function isCheckboxField(field: AddedField): boolean {
    return field.type === FieldType.CHECKBOX;
  }

  // 진단 테이블 필드인지 확인하는 헬퍼 함수
  function isDiagnosisTableField(field: AddedField): boolean {
    return field.type === FieldType.DIAGNOSIS_TABLE;
  }

  // 기간 필드인지 확인하는 헬퍼 함수 (DATE 타입이면서 dateRange 옵션이 있는 경우)
  function isDateRangeField(field: AddedField): boolean {
    return field.type === FieldType.DATE && Boolean(field.options?.dateRange);
  }

  // 라디오 체크박스인지 확인하는 헬퍼 함수 (체크박스이면서 radioGroup 옵션이 있는 경우)
  function isRadioCheckbox(field: AddedField): boolean {
    return field.type === FieldType.CHECKBOX && Boolean(field.options?.radioGroup);
  }

  // 체크박스 옆(우측) 라벨 텍스트 (문서 렌더링과 유사한 개념)
  // - HTML 라벨은 Konva에서 렌더링할 수 없어 텍스트만 추출해 표시합니다.
  function getCheckboxSideLabelText(field: AddedField): string {
    const format = field.options?.checkboxLabelFormat;
    const labelTextRaw = field.options?.checkboxLabelText;
    const labelHtmlRaw = field.options?.checkboxLabelHtml;

    // HTML 모드면 HTML에서 텍스트만 추출해서 표시
    if (format === CheckboxLabelFormat.HTML && typeof labelHtmlRaw === 'string') {
      const raw = labelHtmlRaw.trim();
      if (!raw) return '';
      try {
        const doc = new DOMParser().parseFromString(raw, 'text/html');
        return (doc.body.textContent ?? '').trim();
      } catch {
        // DOMParser 실패 시 태그 제거 폴백
        return raw.replace(/<[^>]*>/g, '').trim();
      }
    }

    // 기본은 TEXT
    if (typeof labelTextRaw === 'string') return labelTextRaw.trim();
    return '';
  }

  function getEffectiveCheckboxHitPadding(field: AddedField): number {
    const checkboxSideLabelText = getCheckboxSideLabelText(field);
    const hasCheckboxSideLabel = checkboxSideLabelText.length > 0;
    const configuredHitPaddingPx = field.options?.checkboxHitPaddingPx;
    const hasConfiguredHitPaddingPx = typeof configuredHitPaddingPx === 'number' && configuredHitPaddingPx >= 0;
    const defaultHitPaddingPx = hasCheckboxSideLabel
      ? FIELD_EDITOR_UI.checkbox.hitPaddingWithLabelPx
      : FIELD_EDITOR_UI.checkbox.hitPaddingWithoutLabelPx;

    return hasConfiguredHitPaddingPx ? configuredHitPaddingPx : defaultHitPaddingPx;
  }

  // 체크박스 필드의 체크 표시를 렌더링하는 함수
  function renderCheckboxMark(x: number, y: number, width: number, height: number) {
    const padding = Math.min(width, height) * 0.2;
    const checkSize = Math.min(width, height) - padding * 2;
    const startX = x + padding;
    const startY = y + padding;

    // 체크 표시 (V자 모양)
    const checkPoints = [
      startX + checkSize * 0.2,
      startY + checkSize * 0.5,
      startX + checkSize * 0.4,
      startY + checkSize * 0.7,
      startX + checkSize * 0.8,
      startY + checkSize * 0.2,
    ];

    return (
      <Line
        points={checkPoints}
        stroke="#ffffff"
        strokeWidth={Math.max(2, checkSize * 0.1)}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );
  }

  // 드래그 박스 영역과 교차하는 필드 찾기
  function getFieldsInDragBox(startX: number, startY: number, endX: number, endY: number): AddedField[] {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    return fields.filter((field) => {
      const fieldRight = field.x + field.width;
      const fieldBottom = field.y + field.height;
      return (
        field.x < maxX &&
        fieldRight > minX &&
        field.y < maxY &&
        fieldBottom > minY
      );
    });
  }

  // 선택된 필드가 변경되면 Transformer 업데이트
  useEffect(function syncTransformerSelection() {
    if (selectedField && transformerRef.current && fieldRefs.current[selectedField.key]) {
      transformerRef.current.nodes([fieldRefs.current[selectedField.key]]);
      transformerRef.current.getLayer().batchDraw();
    } else if (!selectedField && transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedField]);

  // 선택된 히트 영역이 변경되거나 드래그 상태가 변경되면 HitArea Transformer 업데이트
  // 드래그 중에는 Rect가 드래그 레이어로 이동하므로 Transformer를 분리하고,
  // 드래그 종료 시 메인 레이어 Rect에 다시 연결
  useEffect(function syncHitAreaTransformerSelection() {
    if (selectedHitAreaFieldKey && !draggingHitAreaFieldKey && hitAreaTransformerRef.current && hitAreaRefs.current[selectedHitAreaFieldKey]) {
      hitAreaTransformerRef.current.nodes([hitAreaRefs.current[selectedHitAreaFieldKey]]);
      hitAreaTransformerRef.current.getLayer().batchDraw();
    } else if (hitAreaTransformerRef.current) {
      hitAreaTransformerRef.current.nodes([]);
      hitAreaTransformerRef.current.getLayer().batchDraw();
    }
  }, [selectedHitAreaFieldKey, draggingHitAreaFieldKey]);

  // TEXTAREA 필드의 최대 줄 수 계산
  // LimitedTextarea의 동적 tolerance(반 줄)와 동일한 기준 적용
  function getTextareaMaxLines(field: AddedField): number {
    const fontSize = field.fontSize || 12;
    const lineHeight = fontSize * 1.4;
    const tolerancePx = Math.round(fontSize * 1.4 * 0.5); // 반 줄 tolerance
    const availableHeight = field.height - 4 + tolerancePx; // padding 상하 합 4px
    return Math.max(1, Math.floor(availableHeight / lineHeight));
  }

  // 필드 라벨 텍스트 생성 (TEXTAREA이면 "필드명 · N줄" 형태)
  function getFieldLabelText(field: AddedField): string {
    if (field.type === FieldType.TEXTAREA) {
      const maxLines = getTextareaMaxLines(field);
      return `${field.name} · ${maxLines}줄`;
    }
    return field.name;
  }

  // 라벨 텍스트 너비 측정
  useEffect(function measureLabelWidths() {
    const newWidths: { [key: string]: number } = {};
    fields.forEach((field) => {
      // 체크박스는 상단 "필드 라벨"을 표시하지 않으므로 너비 측정에서 제외
      if (field.type === FieldType.CHECKBOX) return;
      const textToMeasure = getFieldLabelText(field);

      const textWidth = measureTextWidth(textToMeasure, 12, 'bold');
      if (textWidth > 0) {
        newWidths[field.key] = textWidth + 12; // padding 6px * 2
      }
    });
    if (Object.keys(newWidths).length > 0) {
      setLabelWidths((prev) => ({ ...prev, ...newWidths }));
    }
  }, [fields]);

  useEffect(function syncBulkEditInputs() {
    const isMultiSelection = selectedFields.length >= 2;
    if (!isMultiSelection) {
      setBulkWidthInput('');
      setBulkHeightInput('');
      setBulkHitPaddingInput('');
      return;
    }

    const commonWidth = getCommonNumericValue(selectedFields, (field) => field.width);
    const commonHeight = getCommonNumericValue(selectedFields, (field) => field.height);
    setBulkWidthInput(commonWidth === null ? '' : String(Math.round(commonWidth)));
    setBulkHeightInput(commonHeight === null ? '' : String(Math.round(commonHeight)));

    const checkboxFields = selectedFields.filter(isCheckboxField);
    const hasCheckboxSelection = checkboxFields.length > 0;
    if (!hasCheckboxSelection) {
      setBulkHitPaddingInput('');
      return;
    }

    const commonHitPadding = getCommonNumericValue(checkboxFields, (field) => getEffectiveCheckboxHitPadding(field));
    setBulkHitPaddingInput(commonHitPadding === null ? '' : String(Math.round(commonHitPadding)));
  }, [selectedFields]);

  useEffect(function trackAltKeyForSnapDisable() {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        isAltPressedRef.current = true;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Alt') {
        isAltPressedRef.current = false;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(function registerKeyboardShortcuts() {
    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreEditorShortcut(e)) return;

      const hasSelection = selectedFields.length > 0 || Boolean(selectedField);
      if (!hasSelection) return;

      const isMac = navigator.platform.toLowerCase().includes('mac');
      const isCommandKey = isMac ? e.metaKey : e.ctrlKey;
      const lowerKey = e.key.toLowerCase();

      if (isCommandKey && lowerKey === 'c') {
        e.preventDefault();
        copySelectedFields();
        return;
      }

      if (isCommandKey && lowerKey === 'v') {
        e.preventDefault();
        pasteClipboardFields();
        return;
      }

      const isArrowKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(lowerKey);
      if (!isArrowKey) return;

      e.preventDefault();
      const baseStep = e.shiftKey ? 10 : 1;
      const isResizeMode = e.altKey;
      const step = baseStep;
      const delta = getArrowDelta(lowerKey, step);

      if (isResizeMode) {
        resizeSelectedFields(delta.dx, delta.dy);
      } else {
        moveSelectedFields(delta.dx, delta.dy);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedFields, selectedField, fields]);

  if (width === 0 || height === 0) {
    return null;
  }

  const scheduleGuideUpdate = (guides: ActiveGuides) => {
    pendingGuidesRef.current = guides;
    if (guideRafRef.current !== null) return;

    guideRafRef.current = window.requestAnimationFrame(() => {
      setActiveGuides(pendingGuidesRef.current);
      guideRafRef.current = null;
    });
  };

  const clearActiveGuides = () => {
    scheduleGuideUpdate({ verticalX: null, horizontalY: null });
  };

  const handleDragEnd = (e: any, field: AddedField) => {
    const groupDragState = groupDragStateRef.current;
    const isGroupDragEnd = groupDragState?.driverFieldKey === field.key;
    if (isGroupDragEnd && groupDragState) {
      const updatedFields = groupDragState.fieldKeys
        .map((key) => {
          const base = fields.find((f) => f.key === key) ?? selectedFields.find((f) => f.key === key);
          const node = fieldRefs.current[key];
          if (!base || !node) return null;
          return {
            ...base,
            x: node.x(),
            y: node.y(),
          };
        })
        .filter((f): f is AddedField => f !== null);

      updateFields(updatedFields);
      groupDragStateRef.current = null;
      dragStateRef.current = null;
      clearActiveGuides();
      return;
    }

    const node = e.target;
    const updatedField: AddedField = {
      ...field,
      x: node.x(),
      y: node.y(),
    };
    onFieldUpdate?.(updatedField);
    dragStateRef.current = null;
    groupDragStateRef.current = null;
    clearActiveGuides();
  };

  const handleDragStart = (e: any, field: AddedField) => {
    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();
    if (!pointerPos) return;

    const isMultiSelection = selectedFields.length >= 2;
    const isDraggedFieldInSelection = selectedFields.some((f) => f.key === field.key);
    const shouldGroupDrag = isMultiSelection && isDraggedFieldInSelection;

    if (shouldGroupDrag) {
      const fieldKeys = selectedFields.map((f) => f.key);
      const startPositions: Record<string, { x: number; y: number }> = {};

      selectedFields.forEach((f) => {
        const node = fieldRefs.current[f.key];
        startPositions[f.key] = node ? { x: node.x(), y: node.y() } : { x: f.x, y: f.y };
      });

      const fieldsWithStartPos = selectedFields.map((f) => ({
        ...f,
        x: startPositions[f.key]?.x ?? f.x,
        y: startPositions[f.key]?.y ?? f.y,
      }));

      groupDragStateRef.current = {
        driverFieldKey: field.key,
        fieldKeys,
        startPointer: pointerPos,
        startPositions,
        startSelectionBox: getSelectionBoundingBox(fieldsWithStartPos),
      };
      dragStateRef.current = null;
      return;
    }

    const node = e.target;
    dragStateRef.current = {
      fieldKey: field.key,
      startPointer: pointerPos,
      startNode: { x: node.x(), y: node.y() },
    };
    groupDragStateRef.current = null;
  };

  const handleDragMove = (e: any, field: AddedField) => {
    const nativeEvent = e.evt as MouseEvent;
    const isSnapDisabled = Boolean(nativeEvent.altKey);
    const isAxisLockEnabled = Boolean(nativeEvent.shiftKey);

    if (isSnapDisabled) {
      clearActiveGuides();
      return;
    }

    const node = e.target;
    const stage = node.getStage();
    const pointerPos = stage?.getPointerPosition();
    if (!pointerPos) return;

    const groupDragState = groupDragStateRef.current;
    const isGroupDragMove = groupDragState?.driverFieldKey === field.key;
    if (isGroupDragMove && groupDragState) {
      const rawDeltaX = pointerPos.x - groupDragState.startPointer.x;
      const rawDeltaY = pointerPos.y - groupDragState.startPointer.y;
      const isHorizontalDrag = Math.abs(rawDeltaX) >= Math.abs(rawDeltaY);
      const lockedAxis = isAxisLockEnabled ? (isHorizontalDrag ? 'y' : 'x') : null;

      const baseDeltaX = lockedAxis === 'x' ? 0 : rawDeltaX;
      const baseDeltaY = lockedAxis === 'y' ? 0 : rawDeltaY;

      const movingBox = {
        minX: groupDragState.startSelectionBox.minX + baseDeltaX,
        minY: groupDragState.startSelectionBox.minY + baseDeltaY,
        maxX: groupDragState.startSelectionBox.maxX + baseDeltaX,
        maxY: groupDragState.startSelectionBox.maxY + baseDeltaY,
        centerX: groupDragState.startSelectionBox.centerX + baseDeltaX,
        centerY: groupDragState.startSelectionBox.centerY + baseDeltaY,
      };

      const candidateXAnchors = [
        { type: 'left' as const, value: movingBox.minX, offset: 0 },
        { type: 'center' as const, value: movingBox.centerX, offset: movingBox.centerX - movingBox.minX },
        { type: 'right' as const, value: movingBox.maxX, offset: movingBox.maxX - movingBox.minX },
      ];
      const candidateYAnchors = [
        { type: 'top' as const, value: movingBox.minY, offset: 0 },
        { type: 'middle' as const, value: movingBox.centerY, offset: movingBox.centerY - movingBox.minY },
        { type: 'bottom' as const, value: movingBox.maxY, offset: movingBox.maxY - movingBox.minY },
      ];

      const selectedKeySet = new Set(groupDragState.fieldKeys);
      const otherFields = fields.filter((f) => !selectedKeySet.has(f.key));

      const referenceXLines = [
        width / 2,
        ...otherFields.flatMap((f) => [f.x, f.x + f.width / 2, f.x + f.width]),
      ];
      const referenceYLines = [
        height / 2,
        ...otherFields.flatMap((f) => [f.y, f.y + f.height / 2, f.y + f.height]),
      ];

      const shouldSnapX = lockedAxis !== 'x';
      const shouldSnapY = lockedAxis !== 'y';

  const snapXResult = shouldSnapX ? getBestSnap(candidateXAnchors, referenceXLines, FIELD_EDITOR_UI.snap.thresholdPx) : null;
  const snapYResult = shouldSnapY ? getBestSnap(candidateYAnchors, referenceYLines, FIELD_EDITOR_UI.snap.thresholdPx) : null;

      const snapDeltaX = snapXResult ? snapXResult.line - snapXResult.anchor.value : 0;
      const snapDeltaY = snapYResult ? snapYResult.line - snapYResult.anchor.value : 0;

      const finalDeltaX = baseDeltaX + snapDeltaX;
      const finalDeltaY = baseDeltaY + snapDeltaY;

      groupDragState.fieldKeys.forEach((key) => {
        const startPos = groupDragState.startPositions[key];
        const targetNode = fieldRefs.current[key];
        if (!startPos || !targetNode) return;
        targetNode.x(startPos.x + finalDeltaX);
        targetNode.y(startPos.y + finalDeltaY);
      });

      scheduleGuideUpdate({
        verticalX: snapXResult ? snapXResult.line : null,
        horizontalY: snapYResult ? snapYResult.line : null,
      });
      return;
    }

    const dragState = dragStateRef.current;
    const isMissingDragState = !dragState;
    const isOtherFieldDrag = dragState?.fieldKey !== field.key;
    const shouldAbortDragMove = isMissingDragState || isOtherFieldDrag;
    if (shouldAbortDragMove) {
      return;
    }

    const deltaX = pointerPos.x - dragState.startPointer.x;
    const deltaY = pointerPos.y - dragState.startPointer.y;
    const isHorizontalDrag = Math.abs(deltaX) >= Math.abs(deltaY);
    const lockedAxis = isAxisLockEnabled ? (isHorizontalDrag ? 'y' : 'x') : null;

    const nodeWidth = node.width();
    const nodeHeight = node.height();

    const left = node.x();
    const top = node.y();
    const centerX = left + nodeWidth / 2;
    const centerY = top + nodeHeight / 2;
    const right = left + nodeWidth;
    const bottom = top + nodeHeight;

    const candidateXAnchors = [
      { type: 'left' as const, value: left, offset: 0 },
      { type: 'center' as const, value: centerX, offset: nodeWidth / 2 },
      { type: 'right' as const, value: right, offset: nodeWidth },
    ];
    const candidateYAnchors = [
      { type: 'top' as const, value: top, offset: 0 },
      { type: 'middle' as const, value: centerY, offset: nodeHeight / 2 },
      { type: 'bottom' as const, value: bottom, offset: nodeHeight },
    ];

    const otherFields = fields.filter((f) => f.key !== field.key);

    const referenceXLines = [
      width / 2,
      ...otherFields.flatMap((f) => [f.x, f.x + f.width / 2, f.x + f.width]),
    ];
    const referenceYLines = [
      height / 2,
      ...otherFields.flatMap((f) => [f.y, f.y + f.height / 2, f.y + f.height]),
    ];

    const shouldSnapX = lockedAxis !== 'x';
    const shouldSnapY = lockedAxis !== 'y';

    const snapXResult = shouldSnapX
      ? getBestSnap(candidateXAnchors, referenceXLines, FIELD_EDITOR_UI.snap.thresholdPx)
      : null;
    const snapYResult = shouldSnapY
      ? getBestSnap(candidateYAnchors, referenceYLines, FIELD_EDITOR_UI.snap.thresholdPx)
      : null;

    if (isAxisLockEnabled) {
      if (lockedAxis === 'x') node.x(dragState.startNode.x);
      if (lockedAxis === 'y') node.y(dragState.startNode.y);
    }

    if (snapXResult) {
      node.x(snapXResult.line - snapXResult.anchor.offset);
    }
    if (snapYResult) {
      node.y(snapYResult.line - snapYResult.anchor.offset);
    }

    scheduleGuideUpdate({
      verticalX: snapXResult ? snapXResult.line : null,
      horizontalY: snapYResult ? snapYResult.line : null,
    });
  };

  const handleSelectionBoxDragStart = (e: any) => {
    e.cancelBubble = true;
    if (selectedFields.length < 2) return;

    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();
    if (!pointerPos) return;

    const fieldKeys = selectedFields.map((f) => f.key);
    const startPositions: Record<string, { x: number; y: number }> = {};

    selectedFields.forEach((f) => {
      const node = fieldRefs.current[f.key];
      startPositions[f.key] = node ? { x: node.x(), y: node.y() } : { x: f.x, y: f.y };
    });

    const fieldsWithStartPos = selectedFields.map((f) => ({
      ...f,
      x: startPositions[f.key]?.x ?? f.x,
      y: startPositions[f.key]?.y ?? f.y,
    }));

    groupDragStateRef.current = {
      driverFieldKey: FIELD_EDITOR_UI.multiSelect.driverKey,
      fieldKeys,
      startPointer: pointerPos,
      startPositions,
      startSelectionBox: getSelectionBoundingBox(fieldsWithStartPos),
    };
    dragStateRef.current = null;
  };

  const handleSelectionBoxDragMove = (e: any) => {
    const nativeEvent = e.evt as MouseEvent;
    const isSnapDisabled = Boolean(nativeEvent.altKey);
    const isAxisLockEnabled = Boolean(nativeEvent.shiftKey);

    if (isSnapDisabled) {
      clearActiveGuides();
      return;
    }

    const groupDragState = groupDragStateRef.current;
    if (!groupDragState || groupDragState.driverFieldKey !== FIELD_EDITOR_UI.multiSelect.driverKey) return;

    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();
    if (!pointerPos) return;

    const rawDeltaX = pointerPos.x - groupDragState.startPointer.x;
    const rawDeltaY = pointerPos.y - groupDragState.startPointer.y;
    const isHorizontalDrag = Math.abs(rawDeltaX) >= Math.abs(rawDeltaY);
    const lockedAxis = isAxisLockEnabled ? (isHorizontalDrag ? 'y' : 'x') : null;

    const baseDeltaX = lockedAxis === 'x' ? 0 : rawDeltaX;
    const baseDeltaY = lockedAxis === 'y' ? 0 : rawDeltaY;

    const movingBox = {
      minX: groupDragState.startSelectionBox.minX + baseDeltaX,
      minY: groupDragState.startSelectionBox.minY + baseDeltaY,
      maxX: groupDragState.startSelectionBox.maxX + baseDeltaX,
      maxY: groupDragState.startSelectionBox.maxY + baseDeltaY,
      centerX: groupDragState.startSelectionBox.centerX + baseDeltaX,
      centerY: groupDragState.startSelectionBox.centerY + baseDeltaY,
    };

    const candidateXAnchors = [
      { type: 'left' as const, value: movingBox.minX, offset: 0 },
      { type: 'center' as const, value: movingBox.centerX, offset: movingBox.centerX - movingBox.minX },
      { type: 'right' as const, value: movingBox.maxX, offset: movingBox.maxX - movingBox.minX },
    ];
    const candidateYAnchors = [
      { type: 'top' as const, value: movingBox.minY, offset: 0 },
      { type: 'middle' as const, value: movingBox.centerY, offset: movingBox.centerY - movingBox.minY },
      { type: 'bottom' as const, value: movingBox.maxY, offset: movingBox.maxY - movingBox.minY },
    ];

    const selectedKeySet = new Set(groupDragState.fieldKeys);
    const otherFields = fields.filter((f) => !selectedKeySet.has(f.key));

    const referenceXLines = [
      width / 2,
      ...otherFields.flatMap((f) => [f.x, f.x + f.width / 2, f.x + f.width]),
    ];
    const referenceYLines = [
      height / 2,
      ...otherFields.flatMap((f) => [f.y, f.y + f.height / 2, f.y + f.height]),
    ];

    const shouldSnapX = lockedAxis !== 'x';
    const shouldSnapY = lockedAxis !== 'y';

    const snapXResult = shouldSnapX ? getBestSnap(candidateXAnchors, referenceXLines, FIELD_EDITOR_UI.snap.thresholdPx) : null;
    const snapYResult = shouldSnapY ? getBestSnap(candidateYAnchors, referenceYLines, FIELD_EDITOR_UI.snap.thresholdPx) : null;

    const snapDeltaX = snapXResult ? snapXResult.line - snapXResult.anchor.value : 0;
    const snapDeltaY = snapYResult ? snapYResult.line - snapYResult.anchor.value : 0;

    const finalDeltaX = baseDeltaX + snapDeltaX;
    const finalDeltaY = baseDeltaY + snapDeltaY;

    groupDragState.fieldKeys.forEach((key) => {
      const startPos = groupDragState.startPositions[key];
      const targetNode = fieldRefs.current[key];
      if (!startPos || !targetNode) return;
      targetNode.x(startPos.x + finalDeltaX);
      targetNode.y(startPos.y + finalDeltaY);
    });

    scheduleGuideUpdate({
      verticalX: snapXResult ? snapXResult.line : null,
      horizontalY: snapYResult ? snapYResult.line : null,
    });
  };

  const handleSelectionBoxDragEnd = (e: any) => {
    e.cancelBubble = true;
    const groupDragState = groupDragStateRef.current;
    if (!groupDragState || groupDragState.driverFieldKey !== FIELD_EDITOR_UI.multiSelect.driverKey) return;

    const updatedFields = groupDragState.fieldKeys
      .map((key) => {
        const base = fields.find((f) => f.key === key) ?? selectedFields.find((f) => f.key === key);
        const node = fieldRefs.current[key];
        if (!base || !node) return null;
        return {
          ...base,
          x: node.x(),
          y: node.y(),
        };
      })
      .filter((f): f is AddedField => f !== null);

    updateFields(updatedFields);
    groupDragStateRef.current = null;
    clearActiveGuides();
  };

  const handleTransformEnd = (e: any, field: AddedField) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const transformer = transformerRef.current;
    const activeAnchor =
      typeof transformer?.getActiveAnchor === 'function'
        ? (transformer.getActiveAnchor() as string | null)
        : null;
    const isAnchorKnown = typeof activeAnchor === 'string' && activeAnchor.length > 0;
    const shouldUpdateX = Boolean(activeAnchor?.includes('left'));
    const shouldUpdateY = Boolean(activeAnchor?.includes('top'));

    // 스케일을 리셋하고 width/height 업데이트
    node.scaleX(1);
    node.scaleY(1);

    const isCheckbox = isCheckboxField(field);
    let newWidth = Math.max(5, node.width() * scaleX);
    let newHeight = Math.max(5, node.height() * scaleY);

    // 체크박스 필드는 항상 정사각형으로 유지
    if (isCheckbox) {
      const size = Math.max(newWidth, newHeight);
      newWidth = size;
      newHeight = size;
    }

    const nextX = isAnchorKnown ? (shouldUpdateX ? node.x() : field.x) : node.x();
    const nextY = isAnchorKnown ? (shouldUpdateY ? node.y() : field.y) : node.y();

    const updatedField: AddedField = {
      ...field,
      x: nextX,
      y: nextY,
      width: newWidth,
      height: newHeight,
    };
    onFieldUpdate?.(updatedField);
    clearActiveGuides();
  };

  // 체크박스 히트 영역 클릭 핸들러
  const handleHitAreaClick = (e: any, field: AddedField) => {
    e.cancelBubble = true;
    const nativeEvent = e.evt as MouseEvent;
    if (nativeEvent.button === 2 || nativeEvent.type === 'contextmenu') {
      return;
    }
    // 히트 영역 선택 시 필드 선택 해제
    setSelectedField(null);
    setSelectedFields([]);
    setSelectedHitAreaFieldKey(field.key);
  };

  // 히트 영역이 체크박스와 항상 겹치도록 제약하는 함수
  // hitAreaX, hitAreaY는 체크박스 기준 상대 좌표
  function constrainHitAreaToOverlapCheckbox(
    hitAreaX: number,
    hitAreaY: number,
    hitAreaWidth: number,
    hitAreaHeight: number,
    checkboxWidth: number,
    checkboxHeight: number
  ) {
    let constrainedX = hitAreaX;
    let constrainedY = hitAreaY;

    // 히트 영역의 오른쪽 끝이 체크박스 왼쪽(0)보다 커야 함
    // hitAreaX + hitAreaWidth > 0 => hitAreaX > -hitAreaWidth
    if (constrainedX + hitAreaWidth <= 0) {
      constrainedX = -hitAreaWidth + 1;
    }

    // 히트 영역의 왼쪽 끝이 체크박스 오른쪽(checkboxWidth)보다 작아야 함
    // hitAreaX < checkboxWidth
    if (constrainedX >= checkboxWidth) {
      constrainedX = checkboxWidth - 1;
    }

    // 히트 영역의 아래쪽 끝이 체크박스 위쪽(0)보다 커야 함
    // hitAreaY + hitAreaHeight > 0 => hitAreaY > -hitAreaHeight
    if (constrainedY + hitAreaHeight <= 0) {
      constrainedY = -hitAreaHeight + 1;
    }

    // 히트 영역의 위쪽 끝이 체크박스 아래쪽(checkboxHeight)보다 작아야 함
    // hitAreaY < checkboxHeight
    if (constrainedY >= checkboxHeight) {
      constrainedY = checkboxHeight - 1;
    }

    return { x: constrainedX, y: constrainedY };
  }

  // 히트 영역에서 필드의 상대 좌표를 가져오는 헬퍼
  function getHitAreaRelativePosition(field: AddedField) {
    const checkboxHitPaddingPx = getEffectiveCheckboxHitPadding(field);
    const defaultHitAreaX = -checkboxHitPaddingPx;
    const defaultHitAreaY = -checkboxHitPaddingPx;
    return {
      x: field.options?.checkboxHitAreaX ?? defaultHitAreaX,
      y: field.options?.checkboxHitAreaY ?? defaultHitAreaY,
    };
  }

  // 체크박스 히트 영역 드래그 시작 핸들러
  // 히트 영역 드래그 시 필드 전체(필드 + 히트 영역)가 상대 위치를 유지한 채 함께 이동
  const handleHitAreaDragStart = (e: any, field: AddedField) => {
    e.cancelBubble = true;
    // 드래그 중 Transformer 분리
    setDraggingHitAreaFieldKey(field.key);
  };

  // 체크박스 히트 영역 드래그 중 핸들러
  // 필드 Rect의 Konva 노드 위치를 실시간 동기화하여 함께 이동하는 것처럼 보이게 함
  const handleHitAreaDragMove = (e: any, field: AddedField) => {
    const hitAreaNode = e.target;
    const fieldNode = fieldRefs.current[field.key];
    if (!fieldNode) return;

    const hitAreaRel = getHitAreaRelativePosition(field);
    // 히트 영역의 현재 절대 위치에서 필드의 위치를 역산
    fieldNode.x(hitAreaNode.x() - hitAreaRel.x);
    fieldNode.y(hitAreaNode.y() - hitAreaRel.y);
  };

  // 체크박스 히트 영역 드래그 종료 핸들러
  // 필드 전체를 이동하고, 히트 영역의 상대 위치는 유지
  const handleHitAreaDragEnd = (e: any, field: AddedField) => {
    e.cancelBubble = true;
    const node = e.target;

    const hitAreaRel = getHitAreaRelativePosition(field);

    // 드래그 후 히트 영역의 절대 위치에서 필드의 새 위치를 역산
    const newFieldX = node.x() - hitAreaRel.x;
    const newFieldY = node.y() - hitAreaRel.y;

    const updatedField: AddedField = {
      ...field,
      x: newFieldX,
      y: newFieldY,
      // 히트 영역의 상대 위치는 변경하지 않음 (기존 값 유지)
    };
    onFieldUpdate?.(updatedField);
    clearActiveGuides();
    // 드래그 종료 시 Transformer 재연결
    setDraggingHitAreaFieldKey(null);
  };

  // 체크박스 히트 영역 Transform 종료 핸들러
  const handleHitAreaTransformEnd = (e: any, field: AddedField) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(FIELD_EDITOR_UI.checkbox.hitArea.minWidthPx, node.width() * scaleX);
    const newHeight = Math.max(FIELD_EDITOR_UI.checkbox.hitArea.minHeightPx, node.height() * scaleY);

    // 히트 영역의 절대 위치에서 체크박스 기준 상대 위치로 변환
    const rawHitAreaX = node.x() - field.x;
    const rawHitAreaY = node.y() - field.y;

    // 히트 영역이 체크박스와 겹치도록 제약
    const constrained = constrainHitAreaToOverlapCheckbox(
      rawHitAreaX,
      rawHitAreaY,
      newWidth,
      newHeight,
      field.width,
      field.height
    );

    // 제약 적용 후 노드 위치도 업데이트
    node.x(field.x + constrained.x);
    node.y(field.y + constrained.y);
    node.width(newWidth);
    node.height(newHeight);

    const updatedField: AddedField = {
      ...field,
      options: {
        ...(field.options ?? {}),
        checkboxHitAreaX: constrained.x,
        checkboxHitAreaY: constrained.y,
        checkboxHitAreaWidth: newWidth,
        checkboxHitAreaHeight: newHeight,
      },
    };
    onFieldUpdate?.(updatedField);
    // 성능 최적화: Transform 종료 시 메인 레이어로 복귀
    setDraggingHitAreaFieldKey(null);
  };

  const handleFieldClick = (e: any, field: AddedField) => {
    e.cancelBubble = true; // 이벤트 버블링 방지

    // 오른쪽 클릭(우클릭)은 무시 (컨텍스트 메뉴 핸들러에서 처리)
    const nativeEvent = e.evt as MouseEvent;
    if (nativeEvent.button === 2 || nativeEvent.type === 'contextmenu') {
      return;
    }

    // 히트 영역 선택 해제
    setSelectedHitAreaFieldKey(null);

    // Shift 키가 눌려있으면 다수 선택 모드
    if (e.evt.shiftKey) {
      const isAlreadySelected = selectedFields.some((f) => f.key === field.key);
      if (isAlreadySelected) {
        // 이미 선택된 필드면 제거
        setSelectedFields(selectedFields.filter((f) => f.key !== field.key));
      } else {
        // 선택되지 않은 필드면 추가
        setSelectedFields([...selectedFields, field]);
      }
      setSelectedField(null); // 단일 선택 해제
    } else {
      // 일반 클릭은 단일 선택
      setSelectedField(field);
      setSelectedFields([]);
    }
  };

  const handleStageClick = (e: any) => {
    // 드래그 박스 선택은 mouseup 이후 click 이벤트가 이어서 발생합니다.
    // 이 때 Stage click으로 선택 해제가 바로 실행되면 "드래그 선택이 안 되는" 것처럼 보이므로 1회 무시합니다.
    if (suppressNextStageClickRef.current) {
      suppressNextStageClickRef.current = false;
      return;
    }

    // 오른쪽 클릭(우클릭)은 무시 (컨텍스트 메뉴 핸들러에서 처리)
    const nativeEvent = e.evt as MouseEvent;
    if (nativeEvent.button === 2 || nativeEvent.type === 'contextmenu') {
      return;
    }

    // 컨텍스트 메뉴가 열려있으면 클릭 무시 (메뉴 닫기는 외부 클릭 핸들러에서 처리)
    if (contextMenuState?.visible) {
      return;
    }

    // Stage나 배경 Rect를 왼쪽 클릭하면 선택 해제
    const target = e.target;
    const stage = target.getStage();
    const isStageClick = target === stage;
    const isBackgroundRect = target.getClassName() === 'Rect' && target.fill() === 'rgba(0, 0, 0, 0)';

    if (isStageClick || isBackgroundRect) {
      setSelectedField(null);
      setSelectedFields([]);
      setSelectedHitAreaFieldKey(null);
    }
  };

  // 드래그 시작
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // 다중 선택 bbox 드래그 중에는 드래그 박스 선택을 시작하지 않음
    if (e.target?.name && typeof e.target.name === 'function') {
      const targetName = e.target.name();
      if (targetName === 'selection-bbox' || targetName === 'selection-bbox-label') {
        return;
      }
    }

    // 필드가 아닌 곳에서 드래그 시작
    if (e.target === stage || e.target.getClassName() === 'Rect' && e.target.fill() === 'rgba(0, 0, 0, 0)') {
      setIsDragging(true);
      setDragStartPos(pointerPos);
      setDragEndPos(pointerPos);
    }
  };

  // 드래그 중
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage?.getPointerPosition();
    if (!pointerPos) return;

    // 컬럼 리사이징 중인 경우 (상병명 또는 분류기호 divider)
    if (isResizingColumn && resizingFieldKey && (resizingNameColumnRatio !== null || resizingCodeColumnStartRatio !== null) && resizeStartX !== null) {
      const field = fields.find((f) => f.key === resizingFieldKey);
      if (field && field.options?.diagnosisTable) {
        const dividerXInField = pointerPos.x - field.x;
        const newRatio = dividerXInField / field.width;
        const minRatio = 0.1;

        if (resizingNameColumnRatio !== null) {
          // 상병명 끝 divider: codeColumnStartRatio 이하로 제한
          const codeStart = resizingCodeColumnStartRatio ?? field.options.diagnosisTable.codeColumnStartRatio ?? field.options.diagnosisTable.nameColumnRatio;
          const clampedRatio = Math.max(minRatio, Math.min(codeStart, newRatio));
          setResizingNameColumnRatio(clampedRatio);
        } else if (resizingCodeColumnStartRatio !== null) {
          // 분류기호 시작 divider: nameColumnRatio 이상으로 제한
          const nameEnd = resizingNameColumnRatio ?? field.options.diagnosisTable.nameColumnRatio;
          const clampedRatio = Math.max(nameEnd, Math.min(1 - minRatio, newRatio));
          setResizingCodeColumnStartRatio(clampedRatio);
        }
      }
      return;
    }

    // 드래그 박스 선택 중인 경우
    if (isDragging && dragStartPos) {
      setDragEndPos(pointerPos);
    }
  };

  // 드래그 종료
  const handleMouseUp = () => {
    // 컬럼 리사이징 종료
    if (isResizingColumn && resizingFieldKey && (resizingNameColumnRatio !== null || resizingCodeColumnStartRatio !== null)) {
      const field = fields.find((f) => f.key === resizingFieldKey);
      if (field && field.options?.diagnosisTable) {
        const updatedDiagnosisTable = { ...field.options.diagnosisTable };
        if (resizingNameColumnRatio !== null) {
          updatedDiagnosisTable.nameColumnRatio = resizingNameColumnRatio;
        }
        if (resizingCodeColumnStartRatio !== null) {
          updatedDiagnosisTable.codeColumnStartRatio = resizingCodeColumnStartRatio;
        }
        const updatedField: AddedField = {
          ...field,
          options: {
            ...field.options,
            diagnosisTable: updatedDiagnosisTable,
          },
        };
        onFieldUpdate?.(updatedField);
      }
      setIsResizingColumn(false);
      setResizingFieldKey(null);
      setResizeStartX(0);
      setResizingNameColumnRatio(null);
      setResizingCodeColumnStartRatio(null);

      // 커서 복원
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'default';
      }
    }

    // 드래그 박스 선택 종료
    if (!isDragging || !dragStartPos || !dragEndPos) {
      setIsDragging(false);
      setDragStartPos(null);
      setDragEndPos(null);
      return;
    }

    const selectedFieldsInBox = getFieldsInDragBox(
      dragStartPos.x,
      dragStartPos.y,
      dragEndPos.x,
      dragEndPos.y
    );

    if (selectedFieldsInBox.length > 0) {
      setSelectedFields(selectedFieldsInBox);
      setSelectedField(null); // 단일 선택 해제
    } else {
      // 드래그 박스가 비어있다면 선택 해제 (PPT 동작과 유사)
      setSelectedFields([]);
      setSelectedField(null);
    }
    // 히트 영역 선택도 해제 (빈 공간 클릭 또는 드래그 선택 시)
    setSelectedHitAreaFieldKey(null);

    // mouseup 이후 click 이벤트로 선택이 즉시 해제되는 것을 방지
    suppressNextStageClickRef.current = true;

    setIsDragging(false);
    setDragStartPos(null);
    setDragEndPos(null);
  };

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    // 브라우저 클라이언트 좌표 가져오기
    const nativeEvent = e.evt as MouseEvent;
    const clientX = nativeEvent.clientX;
    const clientY = nativeEvent.clientY;

    // 필드 위에서 우클릭한 경우
    const clickedField = fields.find((field) => {
      const node = fieldRefs.current[field.key];
      if (!node) return false;
      const box = node.getClientRect();
      return (
        pointerPos.x >= box.x &&
        pointerPos.x <= box.x + box.width &&
        pointerPos.y >= box.y &&
        pointerPos.y <= box.y + box.height
      );
    });

    // 우클릭 시 선택 상태 유지
    // 이미 선택된 필드가 있으면 선택을 변경하지 않음
    // 필드가 아닌 곳에서 우클릭하고 선택된 필드가 없을 때만 선택 해제는 handleStageClick에서 처리
    if (clickedField) {
      // 클릭한 필드가 선택되지 않았고, 현재 선택된 필드가 없을 때만 선택
      const isInSelectedFields = selectedFields.some((f) => f.key === clickedField.key);
      const isSelectedField = selectedField?.key === clickedField.key;

      if (!isInSelectedFields && !isSelectedField && selectedFields.length === 0 && !selectedField) {
        setSelectedField(clickedField);
        setSelectedFields([]);
      }
      // 이미 선택된 필드 중 하나라면 선택 유지 (아무것도 하지 않음)
    }

    setContextMenuState({
      x: clientX,
      y: clientY,
      visible: true,
      stagePosition: pointerPos, // Stage 내 클릭 위치 저장
    });
    setAddFieldSubmenuOpen(null); // 서브메뉴 초기화
  };

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = () => {
    setContextMenuState(null);
    setAddFieldSubmenuOpen(null);
  };

  const handleAlignFields = (mode: AlignMode) => {
    if (selectedFields.length < 2) return;

    const bbox = getSelectionBoundingBox(selectedFields);

    const updatedFields = selectedFields.map((field) => {
      if (mode === 'left') return { ...field, x: bbox.minX };
      if (mode === 'center') return { ...field, x: bbox.centerX - field.width / 2 };
      if (mode === 'right') return { ...field, x: bbox.maxX - field.width };
      if (mode === 'top') return { ...field, y: bbox.minY };
      if (mode === 'middle') return { ...field, y: bbox.centerY - field.height / 2 };
      return { ...field, y: bbox.maxY - field.height };
    });

    updateFields(updatedFields);
    closeContextMenu();
  };

  const handleEqualizeSize = (mode: EqualizeMode) => {
    if (selectedFields.length < 2) return;
    const baseField = selectedFields[0];
    if (!baseField) return;

    const baseWidth = baseField.width;
    const baseHeight = baseField.height;

    const updatedFields = selectedFields.map((field) => {
      const shouldKeepSquare = isCheckboxType(field);
      const isWidthMode = mode === 'width';
      const isHeightMode = mode === 'height';

      if (shouldKeepSquare) {
        const size = isWidthMode ? baseWidth : isHeightMode ? baseHeight : Math.max(baseWidth, baseHeight);
        return { ...field, width: size, height: size };
      }

      if (isWidthMode) return { ...field, width: baseWidth };
      if (isHeightMode) return { ...field, height: baseHeight };
      return { ...field, width: baseWidth, height: baseHeight };
    });

    updateFields(updatedFields);
    closeContextMenu();
  };

  const handleBulkSizeApply = () => {
    const parsedWidth = parsePositiveNumber(bulkWidthInput);
    const parsedHeight = parsePositiveNumber(bulkHeightInput);
    const hasWidthInput = parsedWidth !== null;
    const hasHeightInput = parsedHeight !== null;
    const hasAnyInput = hasWidthInput || hasHeightInput;
    if (!hasAnyInput) return;

    const minSizePx = FIELD_EDITOR_UI.transform.minSizePx;
    const updatedFields = selectedFields.map((field) => {
      const nextWidth = hasWidthInput ? Math.max(minSizePx, parsedWidth ?? minSizePx) : field.width;
      const nextHeight = hasHeightInput ? Math.max(minSizePx, parsedHeight ?? minSizePx) : field.height;
      const shouldKeepSquare = isCheckboxField(field);
      if (shouldKeepSquare) {
        const size = Math.max(nextWidth, nextHeight);
        return { ...field, width: size, height: size };
      }

      return { ...field, width: nextWidth, height: nextHeight };
    });

    updateFields(updatedFields);
  };

  const handleBulkHitPaddingApply = () => {
    const parsedPadding = parseNonNegativeNumber(bulkHitPaddingInput);
    if (parsedPadding === null) return;

    const checkboxFields = selectedFields.filter(isCheckboxField);
    const hasCheckboxSelection = checkboxFields.length > 0;
    if (!hasCheckboxSelection) return;

    const updatedFields = checkboxFields.map((field) => ({
      ...field,
      options: {
        ...(field.options ?? {}),
        checkboxHitPaddingPx: parsedPadding,
      },
    }));

    updateFields(updatedFields);
  };

  const getActiveSelectionFields = () => {
    if (selectedFields.length > 0) return selectedFields;
    if (selectedField) return [selectedField];
    return [];
  };

  const copySelectedFields = () => {
    const activeFields = getActiveSelectionFields();
    if (activeFields.length === 0) return;
    clipboardRef.current = {
      fields: activeFields.map((field) => ({
        ...field,
        options: field.options ? { ...field.options } : field.options,
      })),
      pasteIndex: 0,
    };
  };

  const pasteClipboardFields = () => {
    const clipboard = clipboardRef.current;
    if (!clipboard || clipboard.fields.length === 0) return;

    const pasteIndex = clipboard.pasteIndex + 1;
    const pasteOffset = FIELD_EDITOR_UI.checkbox.clipboard.pasteOffsetPx * pasteIndex;
    const existingKeys = new Set(fields.map((field) => field.key));
    const orderSeedByPage = createOrderSeedByPage(fields);

    const nextFields = clipboard.fields.map((field) => {
      const nextKey = generateNextFieldKeyFromBase(field.key, existingKeys);
      existingKeys.add(nextKey);
      const nextOrder = getNextOrderForPage(orderSeedByPage, field.pageNumber);

      return {
        ...field,
        key: nextKey,
        x: field.x + pasteOffset,
        y: field.y + pasteOffset,
        order: nextOrder,
        options: field.options ? { ...field.options } : field.options,
      };
    });

    clipboardRef.current = {
      fields: clipboard.fields,
      pasteIndex,
    };

    addFields(nextFields);
    setSelectedFields(nextFields);
    setSelectedField(null);
  };

  const moveSelectedFields = (dx: number, dy: number) => {
    const activeFields = getActiveSelectionFields();
    if (activeFields.length === 0) return;

    const updatedFields = activeFields.map((field) => ({
      ...field,
      x: field.x + dx,
      y: field.y + dy,
    }));

    updateFields(updatedFields);
  };

  const resizeSelectedFields = (dx: number, dy: number) => {
    const activeFields = getActiveSelectionFields();
    if (activeFields.length === 0) return;

    const minSizePx = FIELD_EDITOR_UI.transform.minSizePx;
    const updatedFields = activeFields.map((field) => {
      const nextWidth = Math.max(minSizePx, field.width + dx);
      const nextHeight = Math.max(minSizePx, field.height + dy);
      const shouldKeepSquare = isCheckboxField(field);
      if (shouldKeepSquare) {
        const size = Math.max(nextWidth, nextHeight);
        return { ...field, width: size, height: size };
      }

      return { ...field, width: nextWidth, height: nextHeight };
    });

    updateFields(updatedFields);
  };

  // 외부 클릭 감지로 메뉴 닫기
  useEffect(function closeContextMenuOnClick() {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuState?.visible) {
        // 컨텍스트 메뉴 자체를 클릭한 경우는 무시
        const target = event.target as HTMLElement;
        if (target.closest('.context-menu-container')) {
          return;
        }
        closeContextMenu();
        // 메뉴가 닫힐 때 선택은 유지 (사용자가 명시적으로 다른 곳을 클릭할 때까지)
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenuState]);

  const clampContextMenuPosition = () => {
    const menuElement = contextMenuRef.current;
    const stageContainer = stageRef.current?.container?.() ?? null;
    if (!menuElement || !stageContainer) return;

    const menuRect = menuElement.getBoundingClientRect();
    const containerRect = stageContainer.getBoundingClientRect();
    const minLeft = containerRect.left;
    const minTop = containerRect.top;
    const maxLeft = Math.max(minLeft, containerRect.right - menuRect.width);
    const maxTop = Math.max(minTop, containerRect.bottom - menuRect.height);

    setContextMenuState((prev) => {
      if (!prev?.visible) return prev;
      const nextLeft = Math.min(Math.max(prev.x, minLeft), maxLeft);
      const nextTop = Math.min(Math.max(prev.y, minTop), maxTop);
      const shouldUpdatePosition = nextLeft !== prev.x || nextTop !== prev.y;
      if (!shouldUpdatePosition) return prev;
      return {
        ...prev,
        x: nextLeft,
        y: nextTop,
      };
    });
  };

  useEffect(function clampContextMenuOnStateChange() {
    if (!contextMenuState?.visible) return;
    const rafId = requestAnimationFrame(clampContextMenuPosition);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [contextMenuState?.visible, contextMenuState?.x, contextMenuState?.y]);

  useEffect(function clampContextMenuOnSubmenuToggle() {
    if (!contextMenuState?.visible) return;
    const rafId = requestAnimationFrame(clampContextMenuPosition);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [addFieldSubmenuOpen, contextMenuState?.visible]);

  // 라디오 그룹 설정 핸들러
  const handleSetRadioGroup = () => {
    const checkboxFields = selectedFields.length > 0
      ? selectedFields.filter((f) => f.type === FieldType.CHECKBOX)
      : selectedField && selectedField.type === FieldType.CHECKBOX
        ? [selectedField]
        : [];

    if (checkboxFields.length === 0) return;

    const fieldKeys = checkboxFields.map((f) => f.key);
    setRadioGroup(fieldKeys);
    closeContextMenu();
  };

  // 라디오 그룹 해제 핸들러
  const handleRemoveRadioGroup = () => {
    const checkboxFields = selectedFields.length > 0
      ? selectedFields.filter((f) => f.type === FieldType.CHECKBOX && f.options?.radioGroup)
      : selectedField && selectedField.type === FieldType.CHECKBOX && selectedField.options?.radioGroup
        ? [selectedField]
        : [];

    if (checkboxFields.length === 0) return;

    const fieldKeys = checkboxFields.map((f) => f.key);
    removeRadioGroup(fieldKeys);
    closeContextMenu();
  };

  // 점수 그룹 설정 핸들러
  const handleSetScoreGroup = () => {
    const checkboxFields = selectedFields.length > 0
      ? selectedFields.filter((f) => f.type === FieldType.CHECKBOX)
      : selectedField && selectedField.type === FieldType.CHECKBOX
        ? [selectedField]
        : [];

    if (checkboxFields.length === 0) return;

    setScoreGroupDialogFields(checkboxFields);
    setScoreGroupDialogOpen(true);
    closeContextMenu();
  };

  // 점수 그룹 해제 핸들러
  const handleRemoveScoreGroup = () => {
    const checkboxFields = selectedFields.length > 0
      ? selectedFields.filter((f) => f.type === FieldType.CHECKBOX && f.options?.scoreGroup)
      : selectedField && selectedField.type === FieldType.CHECKBOX && selectedField.options?.scoreGroup
        ? [selectedField]
        : [];

    if (checkboxFields.length === 0) return;

    const fieldKeys = checkboxFields.map((f) => f.key);
    removeScoreGroup(fieldKeys);
    closeContextMenu();
  };

  // 필드 삭제 핸들러
  const handleDeleteFields = () => {
    const fieldsToDelete = selectedFields.length > 0
      ? selectedFields
      : selectedField
        ? [selectedField]
        : [];

    if (fieldsToDelete.length === 0) return;

    const fieldKeys = fieldsToDelete.map((f) => f.key);
    deleteFields(fieldKeys);
    closeContextMenu();
  };

  // 필드 추가 핸들러
  const handleAddField = (item: DataItem) => {
    if (!contextMenuState?.stagePosition) return;

    const position = {
      x: contextMenuState.stagePosition.x,
      y: contextMenuState.stagePosition.y,
    };

    addField(item, currentPage, position);
    closeContextMenu();
  };

  // 서브메뉴 토글 핸들러
  const handleSubmenuToggle = (categoryId: string) => {
    setAddFieldSubmenuOpen((prev) => (prev === categoryId ? null : categoryId));
  };

  // 컨텍스트 메뉴에서 표시할 항목 결정
  const getContextMenuItems = () => {
    const activeFields = selectedFields.length > 0
      ? selectedFields
      : selectedField
        ? [selectedField]
        : [];

    const checkboxFields = activeFields.filter((f) => f.type === FieldType.CHECKBOX);
    const hasRadioGroup = checkboxFields.some((f) => f.options?.radioGroup);
    const hasScoreGroup = checkboxFields.some((f) => f.options?.scoreGroup);
    const isMultiSelection = selectedFields.length >= 2;

    const items: Array<{ label: string; onClick: () => void; disabled?: boolean }> = [];

    // 라디오 그룹 설정 (체크박스만 선택된 경우)
    if (checkboxFields.length > 0 && !hasRadioGroup) {
      items.push({
        label: '라디오 그룹으로 설정',
        onClick: handleSetRadioGroup,
      });
    }

    // 그룹 해제 (라디오 그룹에 속한 체크박스 선택 시)
    if (checkboxFields.length > 0 && hasRadioGroup) {
      items.push({
        label: '그룹 해제',
        onClick: handleRemoveRadioGroup,
      });
    }

    // 점수 그룹 설정 (체크박스만 선택된 경우)
    if (checkboxFields.length > 0 && !hasScoreGroup) {
      items.push({
        label: '점수 그룹 설정',
        onClick: handleSetScoreGroup,
      });
    }

    // 점수 그룹 해제 (점수 그룹에 속한 체크박스 선택 시)
    if (checkboxFields.length > 0 && hasScoreGroup) {
      items.push({
        label: '점수 그룹 해제',
        onClick: handleRemoveScoreGroup,
      });
    }

    // 구분선
    if (items.length > 0 && activeFields.length > 0) {
      items.push({
        label: '---',
        onClick: () => { },
        disabled: true,
      });
    }

    // 다중 선택 도구
    if (isMultiSelection) {
      items.push(
        { label: '정렬: 왼쪽', onClick: () => handleAlignFields('left') },
        { label: '정렬: 가운데', onClick: () => handleAlignFields('center') },
        { label: '정렬: 오른쪽', onClick: () => handleAlignFields('right') },
        { label: '정렬: 위', onClick: () => handleAlignFields('top') },
        { label: '정렬: 중앙', onClick: () => handleAlignFields('middle') },
        { label: '정렬: 아래', onClick: () => handleAlignFields('bottom') },
        { label: '---', onClick: () => { }, disabled: true },
        { label: '크기: 동일 너비', onClick: () => handleEqualizeSize('width') },
        { label: '크기: 동일 높이', onClick: () => handleEqualizeSize('height') },
        { label: '크기: 동일 크기', onClick: () => handleEqualizeSize('both') },
        { label: '---', onClick: () => { }, disabled: true }
      );
    }

    // 삭제
    if (activeFields.length > 0) {
      items.push({
        label: '삭제',
        onClick: handleDeleteFields,
      });
    }

    return items;
  };

  const isLivePositionActive = Boolean(dragStateRef.current || groupDragStateRef.current);
  const isMultiSelection = selectedFields.length >= 2;
  const selectionBox = isMultiSelection ? getSelectionBoundingBox(selectedFields) : null;
  const selectionBoxPadding = FIELD_EDITOR_UI.multiSelect.bboxPaddingPx;
  const toolbarOffsetPx = FIELD_EDITOR_UI.multiSelect.toolbarOffsetPx;
  const toolbarHeightPx = FIELD_EDITOR_UI.multiSelect.toolbarHeightPx;
  const toolbarMarginPx = FIELD_EDITOR_UI.multiSelect.toolbarMarginPx;
  const toolbarLeft = selectionBox
    ? clampValue(selectionBox.minX - selectionBoxPadding, 0, Math.max(0, width - FIELD_EDITOR_UI.multiSelect.toolbarMinWidthPx))
    : 0;
  const toolbarTop = selectionBox
    ? getSelectionToolbarTop(selectionBox, selectionBoxPadding, toolbarHeightPx, toolbarMarginPx, toolbarOffsetPx, height)
    : 0;
  const hasCheckboxSelection = selectedFields.some(isCheckboxField);

  return (
    <div className="absolute top-0 left-0 z-2" style={{ pointerEvents: 'auto' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <Layer>
          {/* FIXME: 배경 불필요할시 삭제 */}
          {/* 전체 영역 배경색 */}
          {/* <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="rgba(0, 0, 0, 0)"
            onClick={handleStageClick}
            onTap={handleStageClick}
          /> */}

          {/* 스냅 가이드선 */}
          {activeGuides.verticalX !== null && (
            <Line
              points={[activeGuides.verticalX, 0, activeGuides.verticalX, height]}
              stroke={FIELD_EDITOR_UI.multiSelect.guideStroke}
              strokeWidth={1}
              dash={[6, 4]}
              listening={false}
            />
          )}
          {activeGuides.horizontalY !== null && (
            <Line
              points={[0, activeGuides.horizontalY, width, activeGuides.horizontalY]}
              stroke={FIELD_EDITOR_UI.multiSelect.guideStroke}
              strokeWidth={1}
              dash={[6, 4]}
              listening={false}
            />
          )}

          {/* 다중 선택 강조 영역 */}
          {selectedFields.length > 0 && (
            (() => {
              const selectedFieldsWithLivePos = selectedFields.map((f) => {
                const node = fieldRefs.current[f.key];
                const liveX = typeof node?.x === 'function' ? node.x() : f.x;
                const liveY = typeof node?.y === 'function' ? node.y() : f.y;
                const displayX = isLivePositionActive ? liveX : f.x;
                const displayY = isLivePositionActive ? liveY : f.y;
                return { ...f, x: displayX, y: displayY };
              });

              return (
            <SelectionBoundingBox
              fields={selectedFieldsWithLivePos}
              onDragStart={handleSelectionBoxDragStart}
              onDragMove={handleSelectionBoxDragMove}
              onDragEnd={handleSelectionBoxDragEnd}
            />
              );
            })()
          )}

          {/* 드래그 박스 렌더링 */}
          {isDragging && dragStartPos && dragEndPos && (
            <Rect
              x={Math.min(dragStartPos.x, dragEndPos.x)}
              y={Math.min(dragStartPos.y, dragEndPos.y)}
              width={Math.abs(dragEndPos.x - dragStartPos.x)}
              height={Math.abs(dragEndPos.y - dragStartPos.y)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={1}
              listening={false}
              perfectDrawEnabled={false}
              shadowForStrokeEnabled={false}
            />
          )}

          {/* 추가된 필드들을 동적으로 렌더링 */}
          {fields.map((field) => {
            const isSelected = selectedField?.key === field.key;
            const isMultiSelected = selectedFields.some((f) => f.key === field.key);
            const isCheckbox = isCheckboxField(field);
            const liveNode = fieldRefs.current[field.key];
            const liveX = typeof liveNode?.x === 'function' ? liveNode.x() : field.x;
            const liveY = typeof liveNode?.y === 'function' ? liveNode.y() : field.y;
            const displayX = isLivePositionActive ? liveX : field.x;
            const displayY = isLivePositionActive ? liveY : field.y;

            const isDiagnosisTable = isDiagnosisTableField(field);

            // 테이블 필드는 별도 컴포넌트로 렌더링
            if (isDiagnosisTable) {
              return (
                <DiagnosisTableField
                  key={field.key}
                  field={field}
                  isSelected={isSelected}
                  isMultiSelected={isMultiSelected}
                  isResizingColumn={isResizingColumn}
                  resizingFieldKey={resizingFieldKey}
                  resizingNameColumnRatio={resizingNameColumnRatio}
                  resizingCodeColumnStartRatio={resizingCodeColumnStartRatio}
                  setIsResizingColumn={setIsResizingColumn}
                  setResizingFieldKey={setResizingFieldKey}
                  setResizeStartX={setResizeStartX}
                  setResizingNameColumnRatio={setResizingNameColumnRatio}
                  setResizingCodeColumnStartRatio={setResizingCodeColumnStartRatio}
                  fieldRef={(node) => {
                    if (node) {
                      fieldRefs.current[field.key] = node;
                    }
                  }}
                  labelTextRef={(node) => {
                    if (node) {
                      labelTextRefs.current[field.key] = node;
                    }
                  }}
                  labelWidth={labelWidths[field.key]}
                  handleFieldClick={handleFieldClick}
                  handleDragStart={handleDragStart}
                  handleDragMove={handleDragMove}
                  handleDragEnd={handleDragEnd}
                  handleTransformEnd={handleTransformEnd}
                />
              );
            }

            // 기간 필드 렌더링 (DATE 타입 + dateRange 옵션)
            const isDateRange = isDateRangeField(field);
            if (isDateRange) {
              const separator = (field.options?.dateRange?.separator as string) || '~';
              const dateWidth = (field.width - 28) / 2; // 전체 너비에서 구분자(20) + 간격(8) 뺀 후 2등분
              const separatorWidth = 20;
              const gap = 4;

              return (
                <React.Fragment key={field.key}>
                  {/* 전체 필드 영역 (드래그/선택용) */}
                  <Rect
                    ref={(node) => {
                      if (node) {
                        fieldRefs.current[field.key] = node;
                      }
                    }}
                    x={displayX}
                    y={displayY}
                    width={field.width}
                    height={field.height}
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke={isSelected || isMultiSelected ? "rgba(139, 92, 246, 0.9)" : "rgba(139, 92, 246, 0.6)"}
                    strokeWidth={isSelected || isMultiSelected ? 3 : 2}
                    dash={isMultiSelected ? [10, 6] : undefined}
                    draggable
                    perfectDrawEnabled={false}
                    shadowForStrokeEnabled={false}
                    hitStrokeWidth={0}
                    onClick={(e) => handleFieldClick(e, field)}
                    onTap={(e) => handleFieldClick(e, field)}
                    onDragStart={(e) => handleDragStart(e, field)}
                    onDragMove={(e) => handleDragMove(e, field)}
                    onDragEnd={(e) => handleDragEnd(e, field)}
                    onTransformEnd={(e) => handleTransformEnd(e, field)}
                  />

                  {/* 시작일 영역 */}
                  <Rect
                    x={displayX}
                    y={displayY}
                    width={dateWidth}
                    height={field.height}
                    fill="rgba(139, 92, 246, 0.1)"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth={1}
                    listening={false}
                  />
                  <Text
                    x={displayX}
                    y={displayY}
                    width={dateWidth}
                    height={field.height}
                    text={field.options?.dateRange?.startDate || '시작일'}
                    fontSize={field.fontSize || 12}
                    fill="#6b7280"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />

                  {/* 구분자 */}
                  <Text
                    x={displayX + dateWidth + gap}
                    y={displayY}
                    width={separatorWidth}
                    height={field.height}
                    text={separator}
                    fontSize={field.fontSize || 12}
                    fill="#374151"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />

                  {/* 종료일 영역 */}
                  <Rect
                    x={displayX + dateWidth + gap + separatorWidth + gap}
                    y={displayY}
                    width={dateWidth}
                    height={field.height}
                    fill="rgba(139, 92, 246, 0.1)"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth={1}
                    listening={false}
                  />
                  <Text
                    x={displayX + dateWidth + gap + separatorWidth + gap}
                    y={displayY}
                    width={dateWidth}
                    height={field.height}
                    text={field.options?.dateRange?.endDate || '종료일'}
                    fontSize={field.fontSize || 12}
                    fill="#6b7280"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />

                  {/* 필드 라벨 */}
                  <Group
                    x={displayX}
                    y={displayY - 14}
                    listening={false}
                  >
                    <Rect
                      x={0}
                      y={0}
                      width={labelWidths[field.key] || field.name.length * 7 + 12}
                      height={16}
                      fill="rgba(139, 92, 246, 0.95)"
                      cornerRadius={6}
                      shadowColor="rgba(15, 23, 42, 0.25)"
                      shadowBlur={2}
                      shadowOffsetY={1}
                      listening={false}
                      perfectDrawEnabled={false}
                      shadowForStrokeEnabled={false}
                    />
                    <Text
                      ref={(node) => {
                        if (node) {
                          labelTextRefs.current[field.key] = node;
                        }
                      }}
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

            // 체크박스 필드의 색상 설정
            const getFieldColors = () => {
              if (isCheckbox) {
                // 체크박스는 다른 색상으로 구분
                if (isRadioCheckbox(field)) {
                  // 라디오 체크박스는 그룹별 색상 사용
                  const radioGroupName = field.options?.radioGroup as string;
                  const groupColor = getRadioGroupColor(radioGroupName);
                  return {
                    fill: isSelected || isMultiSelected ? groupColor.fillSelected : groupColor.fill,
                    stroke: isSelected || isMultiSelected ? groupColor.strokeSelected : groupColor.stroke,
                  };
                } else {
                  // 일반 체크박스는 초록색 계열
                  return {
                    fill: isSelected || isMultiSelected ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)",
                    stroke: isSelected || isMultiSelected ? "rgba(34, 197, 94, 0.9)" : "rgba(34, 197, 94, 0.7)",
                  };
                }
              } else {
                // 기존 텍스트 필드 색상
                return {
                  fill: "rgba(0, 123, 255, 0.2)",
                  stroke: isSelected ? "rgba(255, 0, 0, 0.8)" : "rgba(0, 123, 255, 0.8)",
                };
              }
            };

            const colors = getFieldColors();

            const checkboxSideLabelText = isCheckbox ? getCheckboxSideLabelText(field) : '';
            const hasCheckboxSideLabel = isCheckbox && checkboxSideLabelText.length > 0;
            const checkboxSideLabelFontSize = Math.max(10, field.fontSize ?? 12);
            const checkboxSideLabelFontStyle = field.fontWeight === 'bold' ? 'bold' : 'normal';
            const checkboxSideLabelTextWidth = hasCheckboxSideLabel
              ? measureTextWidth(checkboxSideLabelText, checkboxSideLabelFontSize, checkboxSideLabelFontStyle)
              : 0;
            // 히트 영역 계산 (사용자 정의 값 또는 기본 패딩 기반)
            const hasCustomHitArea = isCheckbox && (
              field.options?.checkboxHitAreaWidth !== undefined ||
              field.options?.checkboxHitAreaHeight !== undefined
            );
            const checkboxHitPaddingPx = isCheckbox ? getEffectiveCheckboxHitPadding(field) : 0;
            
            // 기본 히트 영역 계산 (패딩 기반)
            const defaultHitAreaWidth = (hasCheckboxSideLabel
              ? field.width + FIELD_EDITOR_UI.checkbox.sideLabelGapPx + checkboxSideLabelTextWidth
              : field.width) + checkboxHitPaddingPx * 2;
            const defaultHitAreaHeight = field.height + checkboxHitPaddingPx * 2;
            const defaultHitAreaX = -checkboxHitPaddingPx;
            const defaultHitAreaY = -checkboxHitPaddingPx;

            // 사용자 정의 히트 영역 또는 기본값 사용
            const hitAreaRelX = field.options?.checkboxHitAreaX ?? defaultHitAreaX;
            const hitAreaRelY = field.options?.checkboxHitAreaY ?? defaultHitAreaY;
            const hitAreaWidth = field.options?.checkboxHitAreaWidth ?? defaultHitAreaWidth;
            const hitAreaHeight = field.options?.checkboxHitAreaHeight ?? defaultHitAreaHeight;

            // 절대 위치 계산
            const hitAreaAbsX = displayX + hitAreaRelX;
            const hitAreaAbsY = displayY + hitAreaRelY;

            const isHitAreaSelected = selectedHitAreaFieldKey === field.key;
            const isMultiSelectionActive = selectedFields.length > 0;
            const shouldEmphasizeMultiSelection = isMultiSelectionActive && isMultiSelected;
            const clickAreaStroke = isHitAreaSelected
              ? "rgba(34, 197, 94, 1)"
              : shouldEmphasizeMultiSelection
                ? FIELD_EDITOR_UI.checkbox.clickArea.stroke.multi
                : isSelected
                  ? FIELD_EDITOR_UI.checkbox.clickArea.stroke.selected
                  : hasCheckboxSideLabel
                    ? FIELD_EDITOR_UI.checkbox.clickArea.stroke.withLabel
                    : FIELD_EDITOR_UI.checkbox.clickArea.stroke.withoutLabel;
            const clickAreaFill = isHitAreaSelected
              ? "rgba(34, 197, 94, 0.15)"
              : shouldEmphasizeMultiSelection
                ? FIELD_EDITOR_UI.checkbox.clickArea.fill.multi
                : isSelected
                  ? FIELD_EDITOR_UI.checkbox.clickArea.fill.selected
                  : hasCheckboxSideLabel
                    ? FIELD_EDITOR_UI.checkbox.clickArea.fill.withLabel
                    : FIELD_EDITOR_UI.checkbox.clickArea.fill.withoutLabel;

            const shouldShowCheckboxClickArea = isCheckbox && (checkboxHitPaddingPx > 0 || hasCustomHitArea);
            return (
              <React.Fragment key={field.key}>
                {/* 체크박스 클릭 영역(히트 영역) - 드래그/리사이즈 가능 */}
                {shouldShowCheckboxClickArea && (
                  <Rect
                    ref={(node) => {
                      if (node) {
                        hitAreaRefs.current[field.key] = node;
                      }
                    }}
                    x={hitAreaAbsX}
                    y={hitAreaAbsY}
                    width={hitAreaWidth}
                    height={hitAreaHeight}
                    fill={clickAreaFill}
                    stroke={clickAreaStroke}
                    dash={isHitAreaSelected ? undefined : FIELD_EDITOR_UI.checkbox.clickArea.dash}
                    strokeWidth={isHitAreaSelected ? 3 : FIELD_EDITOR_UI.checkbox.clickArea.strokeWidthPx}
                    cornerRadius={FIELD_EDITOR_UI.checkbox.clickArea.cornerRadiusPx}
                    shadowColor={clickAreaStroke}
                    shadowBlur={isHitAreaSelected ? 0 : 6}
                    shadowOffset={isHitAreaSelected ? undefined : { x: 0, y: 1 }}
                    shadowOpacity={isHitAreaSelected ? 0 : 0.6}
                    draggable
                    perfectDrawEnabled={false}
                    shadowForStrokeEnabled={false}
                    hitStrokeWidth={0}
                    onClick={(e) => handleHitAreaClick(e, field)}
                    onTap={(e) => handleHitAreaClick(e, field)}
                    onDragStart={(e) => handleHitAreaDragStart(e, field)}
                    onDragMove={(e) => handleHitAreaDragMove(e, field)}
                    onDragEnd={(e) => handleHitAreaDragEnd(e, field)}
                    onTransformEnd={(e) => handleHitAreaTransformEnd(e, field)}
                  />
                )}

                {/* 필드 영역 */}
                <Rect
                  ref={(node) => {
                    if (node) {
                      fieldRefs.current[field.key] = node;
                    }
                  }}
                  x={displayX}
                  y={displayY}
                  width={field.width}
                  height={field.height}
                  fill={colors.fill}
                  stroke={isMultiSelected ? FIELD_EDITOR_UI.multiSelect.stroke : colors.stroke}
                  strokeWidth={isSelected || isMultiSelected ? 3 : 2}
                  dash={isMultiSelected ? [10, 6] : undefined}
                  draggable
                  perfectDrawEnabled={false}
                  shadowForStrokeEnabled={false}
                  hitStrokeWidth={0}
                  onClick={(e) => handleFieldClick(e, field)}
                  onTap={(e) => handleFieldClick(e, field)}
                  onDragStart={(e) => handleDragStart(e, field)}
                  onDragMove={(e) => handleDragMove(e, field)}
                  onDragEnd={(e) => handleDragEnd(e, field)}
                  onTransformEnd={(e) => handleTransformEnd(e, field)}
                />

                {/* 체크박스 필드인 경우 체크 표시 */}
                {isCheckbox && renderCheckboxMark(displayX, displayY, field.width, field.height)}

                {/* 체크박스 옆 라벨 텍스트 (실제 문서처럼 우측 표시) */}
                {hasCheckboxSideLabel && (
                  <Text
                    x={displayX + field.width + FIELD_EDITOR_UI.checkbox.sideLabelGapPx}
                    y={displayY}
                    width={checkboxSideLabelTextWidth + 2}
                    height={field.height}
                    text={checkboxSideLabelText}
                    fontSize={checkboxSideLabelFontSize}
                    fontStyle={checkboxSideLabelFontStyle}
                    fill="#111827"
                    verticalAlign="middle"
                    listening={false}
                  />
                )}

                {/* TEXTAREA 줄 가이드 점선 (항상 표시) */}
                {field.type === FieldType.TEXTAREA && (() => {
                  const lineHeight = (field.fontSize || 12) * 1.4;
                  const paddingTop = 2;
                  const lines: React.ReactElement[] = [];
                  let y = paddingTop + lineHeight;
                  while (y < field.height - 1) {
                    lines.push(
                      <Line
                        key={`guide-${field.key}-${y}`}
                        points={[displayX + 2, displayY + y, displayX + field.width - 2, displayY + y]}
                        stroke="rgba(239, 68, 68, 0.55)"
                        strokeWidth={1}
                        dash={[4, 4]}
                        listening={false}
                        perfectDrawEnabled={false}
                      />
                    );
                    y += lineHeight;
                  }
                  return lines;
                })()}

                {/* 필드 라벨 - 체크박스는 모양이 명확하므로 표시하지 않음 */}
                {!isCheckbox && (
                  <Group
                    x={displayX}
                    y={displayY - 14}
                    listening={false}
                  >
                    {/* 라벨 배경 */}
                    <Rect
                      x={0}
                      y={0}
                      width={labelWidths[field.key] || getFieldLabelText(field).length * 7 + 12}
                      height={16}
                      fill={"rgba(37, 99, 235, 0.95)"}
                      cornerRadius={6}
                      shadowColor="rgba(15, 23, 42, 0.25)"
                      shadowBlur={2}
                      shadowOffsetY={1}
                      listening={false}
                      perfectDrawEnabled={false}
                      shadowForStrokeEnabled={false}
                    />
                    {/* 라벨 텍스트 */}
                    <Text
                      ref={(node) => {
                        if (node) {
                          labelTextRefs.current[field.key] = node;
                        }
                      }}
                      x={6}
                      y={0}
                      text={getFieldLabelText(field)}
                      fontSize={12}
                      fontStyle="bold"
                      fill="#ffffff"
                      height={16}
                      verticalAlign="middle"
                      listening={false}
                    />
                  </Group>
                )}
              </React.Fragment>
            );
          })}

          {/* Transformer - 단일 선택 시에만 표시 (다수 선택 시 숨김) */}
          {selectedField && selectedFields.length === 0 && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              anchorSize={6}
              anchorStrokeWidth={1}
              anchorCornerRadius={2}
              borderStrokeWidth={1}
              boundBoxFunc={(oldBox, newBox) => {
                const isCheckbox = isCheckboxField(selectedField);
                const isDiagnosisTable = isDiagnosisTableField(selectedField);
                const isSnapDisabled = isAltPressedRef.current;

                // 최소 크기 제한
                if (Math.abs(newBox.width) < FIELD_EDITOR_UI.transform.minSizePx || Math.abs(newBox.height) < FIELD_EDITOR_UI.transform.minSizePx) {
                  return oldBox;
                }

                const constrainedNewBox = applyResizeConstraints(oldBox, newBox, isCheckbox, isDiagnosisTable);
                if (isSnapDisabled) {
                  clearActiveGuides();
                  return constrainedNewBox;
                }

                const otherFields = fields.filter((f) => f.key !== selectedField.key);
                const referenceXLines = [
                  width / 2,
                  ...otherFields.flatMap((f) => [f.x, f.x + f.width / 2, f.x + f.width]),
                ];
                const referenceYLines = [
                  height / 2,
                  ...otherFields.flatMap((f) => [f.y, f.y + f.height / 2, f.y + f.height]),
                ];

                const snapped = applyResizeSnap(oldBox, constrainedNewBox, referenceXLines, referenceYLines, FIELD_EDITOR_UI.snap.thresholdPx);
                const finalBox = applyResizeConstraints(oldBox, snapped.box, isCheckbox, isDiagnosisTable);

                scheduleGuideUpdate({ verticalX: snapped.guides.verticalX, horizontalY: snapped.guides.horizontalY });
                return finalBox;
              }}
            />
          )}

          {/* HitArea Transformer - 히트 영역 선택 시 표시 (대상 Rect와 같은 레이어에 배치) */}
          {selectedHitAreaFieldKey && (() => {
            const hitAreaField = fields.find((f) => f.key === selectedHitAreaFieldKey);
            return (
              <Transformer
                ref={hitAreaTransformerRef}
                rotateEnabled={false}
                ignoreStroke={true}
                anchorSize={6}
                anchorStrokeWidth={1}
                anchorCornerRadius={2}
                borderStrokeWidth={2}
                borderStroke="rgba(34, 197, 94, 1)"
                anchorStroke="rgba(34, 197, 94, 1)"
                anchorFill="#ffffff"
                boundBoxFunc={(oldBox, newBox) => {
                  // 최소 크기 제한
                  if (Math.abs(newBox.width) < FIELD_EDITOR_UI.checkbox.hitArea.minWidthPx ||
                      Math.abs(newBox.height) < FIELD_EDITOR_UI.checkbox.hitArea.minHeightPx) {
                    return oldBox;
                  }

                  // 체크박스와 겹침 제약 확인
                  if (hitAreaField) {
                    const hitAreaRelX = newBox.x - hitAreaField.x;
                    const hitAreaRelY = newBox.y - hitAreaField.y;

                    // 히트 영역이 체크박스와 겹치지 않으면 이전 박스 유지
                    const overlapsX = hitAreaRelX < hitAreaField.width && hitAreaRelX + newBox.width > 0;
                    const overlapsY = hitAreaRelY < hitAreaField.height && hitAreaRelY + newBox.height > 0;

                    if (!overlapsX || !overlapsY) {
                      return oldBox;
                    }
                  }

                  return newBox;
                }}
              />
            );
          })()}
        </Layer>

      </Stage>

      {isMultiSelection && (
        <div
          className="absolute flex items-center rounded-lg border border-amber-300 bg-white/95 shadow-lg backdrop-blur px-3 py-2 text-xs text-gray-700"
          style={{
            left: toolbarLeft,
            top: toolbarTop,
            minWidth: `${FIELD_EDITOR_UI.multiSelect.toolbarMinWidthPx}px`,
            gap: `${FIELD_EDITOR_UI.multiSelect.toolbarGapPx}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="font-semibold text-amber-700">일괄 편집</span>
          <div className="flex items-center gap-1">
            <span>W</span>
            <input
              value={bulkWidthInput}
              onChange={(e) => setBulkWidthInput(e.target.value)}
              className="h-7 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              style={{ width: `${FIELD_EDITOR_UI.multiSelect.toolbarInputWidthPx}px` }}
              placeholder="혼합"
            />
          </div>
          <div className="flex items-center gap-1">
            <span>H</span>
            <input
              value={bulkHeightInput}
              onChange={(e) => setBulkHeightInput(e.target.value)}
              className="h-7 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
              style={{ width: `${FIELD_EDITOR_UI.multiSelect.toolbarInputWidthPx}px` }}
              placeholder="혼합"
            />
          </div>
          <button
            type="button"
            onClick={handleBulkSizeApply}
            className="h-7 rounded bg-amber-500 px-2 text-xs font-semibold text-white hover:bg-amber-600"
          >
            크기 적용
          </button>
          <div className="h-5 w-px bg-amber-200" />
          <div className="flex items-center gap-1">
            <span>클릭 여유</span>
            <input
              value={bulkHitPaddingInput}
              onChange={(e) => setBulkHitPaddingInput(e.target.value)}
              className="h-7 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-100"
              style={{ width: `${FIELD_EDITOR_UI.multiSelect.toolbarInputWidthPx}px` }}
              placeholder={hasCheckboxSelection ? "혼합" : "체크박스만"}
              disabled={!hasCheckboxSelection}
            />
          </div>
          <button
            type="button"
            onClick={handleBulkHitPaddingApply}
            className="h-7 rounded bg-amber-500 px-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={!hasCheckboxSelection}
          >
            여유 적용
          </button>
        </div>
      )}

      {/* 컨텍스트 메뉴 */}
      {contextMenuState?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu-container fixed bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[180px] py-1"
          style={{
            left: `${contextMenuState.x}px`,
            top: `${contextMenuState.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 필드가 선택되지 않은 경우: 필드 추가 메뉴 표시 */}
          {!selectedField && selectedFields.length === 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                필드 추가
              </div>
              {DATA_ITEM_CATEGORIES.map((category) => (
                <div key={category.id} className="relative">
                  <button
                    onClick={() => handleSubmenuToggle(category.id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center justify-between transition-colors"
                  >
                    <span>{category.label}</span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${addFieldSubmenuOpen === category.id ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {/* 서브메뉴 (인라인 확장) */}
                  {addFieldSubmenuOpen === category.id && (
                    <div className="bg-gray-50 border-y border-gray-100">
                      {category.items.map((item) => (
                        <button
                          key={item.keyPrefix}
                          onClick={() => handleAddField(item)}
                          className="w-full text-left pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* 필드가 선택된 경우: 기존 메뉴 표시 */}
          {(selectedField || selectedFields.length > 0) && getContextMenuItems().map((item, index) => {
            if (item.label === '---') {
              return (
                <div
                  key={index}
                  className="border-t border-gray-200 my-1"
                />
              );
            }
            return (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`
                  w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
                  ${item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}
                `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 점수 그룹 설정 다이얼로그 */}
      {scoreGroupDialogOpen && (
        <ScoreGroupDialog
          fields={scoreGroupDialogFields}
          allFields={addedFields}
          numPages={numPages ?? 1}
          onConfirm={(totalFieldName, totalFieldPageNumber) => {
            const fieldKeys = scoreGroupDialogFields.map((f) => f.key);
            setScoreGroup(fieldKeys, totalFieldName, totalFieldPageNumber);
            setScoreGroupDialogOpen(false);
            setScoreGroupDialogFields([]);
          }}
          onCancel={() => {
            setScoreGroupDialogOpen(false);
            setScoreGroupDialogFields([]);
          }}
        />
      )}
    </div>
  );
}

// 점수 그룹 설정 다이얼로그 컴포넌트
function ScoreGroupDialog({
  fields,
  allFields,
  numPages,
  onConfirm,
  onCancel,
}: {
  fields: AddedField[];
  allFields: AddedField[];
  numPages: number;
  onConfirm: (totalFieldName: string, totalFieldPageNumber: number) => void;
  onCancel: () => void;
}) {
  // 총점 필드 이름 자동 생성 함수
  function generateNextTotalFieldName(fields: AddedField[]): string {
    const existingNames = new Set<string>();
    fields.forEach((field) => {
      if (field.name.startsWith('총점')) {
        existingNames.add(field.name);
      }
    });

    let number = 1;
    let name = '총점';
    while (existingNames.has(name)) {
      number++;
      name = `총점_${String(number).padStart(3, '0')}`;
    }
    return name;
  }

  const defaultTotalFieldName = generateNextTotalFieldName(allFields);
  const [totalFieldName, setTotalFieldName] = useState(defaultTotalFieldName);
  const [totalFieldPageNumber, setTotalFieldPageNumber] = useState(
    fields.length > 0 && fields[0] ? fields[0].pageNumber : 1
  );

  const pageOptions = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 border border-gray-300 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">점수 그룹 설정</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            선택된 {fields.length}개의 체크박스에 점수 그룹이 설정됩니다.
            각 체크박스의 점수는 상세 패널에서 설정할 수 있습니다.
          </p>
        </div>

        {/* 총점 필드 이름 입력 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">총점 필드 이름</label>
          <input
            type="text"
            value={totalFieldName}
            onChange={(e) => setTotalFieldName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* 총점 필드 페이지 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">총점 필드 페이지</label>
          <select
            value={totalFieldPageNumber}
            onChange={(e) => setTotalFieldPageNumber(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          >
            {pageOptions.map((page) => (
              <option key={page} value={page}>
                {page}페이지
              </option>
            ))}
          </select>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(totalFieldName, totalFieldPageNumber)}
            disabled={!totalFieldName.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldOverlay;

function getBestSnap<TAnchor extends { value: number; offset: number }>(
  candidates: TAnchor[],
  referenceLines: number[],
  thresholdPx: number
): { line: number; anchor: TAnchor } | null {
  let best: { line: number; anchor: TAnchor; distance: number } | null = null;

  for (const anchor of candidates) {
    for (const line of referenceLines) {
      const distance = Math.abs(anchor.value - line);
      const isWithinThreshold = distance <= thresholdPx;
      if (!isWithinThreshold) continue;

      const isBetterCandidate = !best || distance < best.distance;
      if (isBetterCandidate) {
        best = { line, anchor, distance };
      }
    }
  }

  if (!best) return null;
  return { line: best.line, anchor: best.anchor };
}

type KonvaBox = { x: number; y: number; width: number; height: number; rotation: number };
type ResizeSnapResult = { box: KonvaBox; guides: ActiveGuides };

function applyResizeConstraints(
  oldBox: KonvaBox,
  newBox: KonvaBox,
  isCheckbox: boolean,
  isDiagnosisTable: boolean
): KonvaBox {
  if (isCheckbox) {
    const size = Math.max(Math.abs(newBox.width), Math.abs(newBox.height));
    const newWidth = size * Math.sign(newBox.width);
    const newHeight = size * Math.sign(newBox.height);

    // 어느 edge가 고정인지 파악 (oldBox와 newBox 비교)
    const oldRight = oldBox.x + oldBox.width;
    const oldBottom = oldBox.y + oldBox.height;
    const newRight = newBox.x + newBox.width;
    const newBottom = newBox.y + newBox.height;

    const isLeftEdgeFixed = Math.abs(newBox.x - oldBox.x) < FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
    const isRightEdgeFixed = Math.abs(newRight - oldRight) < FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
    const isTopEdgeFixed = Math.abs(newBox.y - oldBox.y) < FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
    const isBottomEdgeFixed = Math.abs(newBottom - oldBottom) < FIELD_EDITOR_UI.snap.edgeMoveEpsilon;

    // width 조정에 따른 x 보정
    const widthDiff = newWidth - newBox.width;
    let adjustedX = newBox.x;
    if (isLeftEdgeFixed && !isRightEdgeFixed) {
      // 왼쪽 고정, 오른쪽 이동 → x 유지
      adjustedX = newBox.x;
    } else if (!isLeftEdgeFixed && isRightEdgeFixed) {
      // 오른쪽 고정, 왼쪽 이동 → x 보정 (width 증가분만큼 왼쪽으로)
      adjustedX = newBox.x - widthDiff;
    } else {
      // 양쪽 다 이동 또는 양쪽 다 고정 → 중앙 기준 조정
      adjustedX = newBox.x - widthDiff / 2;
    }

    // height 조정에 따른 y 보정
    const heightDiff = newHeight - newBox.height;
    let adjustedY = newBox.y;
    if (isTopEdgeFixed && !isBottomEdgeFixed) {
      // 상단 고정, 하단 이동 → y 유지
      adjustedY = newBox.y;
    } else if (!isTopEdgeFixed && isBottomEdgeFixed) {
      // 하단 고정, 상단 이동 → y 보정 (height 증가분만큼 위로)
      adjustedY = newBox.y - heightDiff;
    } else {
      // 양쪽 다 이동 또는 양쪽 다 고정 → 중앙 기준 조정
      adjustedY = newBox.y - heightDiff / 2;
    }

    return {
      ...newBox,
      x: adjustedX,
      y: adjustedY,
      width: newWidth,
      height: newHeight,
    };
  }

  if (isDiagnosisTable) {
    return {
      ...newBox,
      width: Math.max(FIELD_EDITOR_UI.transform.diagnosisTableMinWidthPx, Math.abs(newBox.width)) * Math.sign(newBox.width),
      height: Math.max(FIELD_EDITOR_UI.transform.diagnosisTableMinHeightPx, Math.abs(newBox.height)) * Math.sign(newBox.height),
    };
  }

  return newBox;
}

function applyResizeSnap(
  oldBox: KonvaBox,
  newBox: KonvaBox,
  referenceXLines: number[],
  referenceYLines: number[],
  thresholdPx: number
): ResizeSnapResult {
  const oldRight = oldBox.x + oldBox.width;
  const newRight = newBox.x + newBox.width;
  const oldBottom = oldBox.y + oldBox.height;
  const newBottom = newBox.y + newBox.height;

  const isLeftEdgeMoving = Math.abs(newBox.x - oldBox.x) > FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
  const isRightEdgeMoving = Math.abs(newRight - oldRight) > FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
  const isTopEdgeMoving = Math.abs(newBox.y - oldBox.y) > FIELD_EDITOR_UI.snap.edgeMoveEpsilon;
  const isBottomEdgeMoving = Math.abs(newBottom - oldBottom) > FIELD_EDITOR_UI.snap.edgeMoveEpsilon;

  // 'none' 모드: 양쪽 edge가 모두 이동하거나 모두 고정인 경우 → snap 비활성화 (위치 변경 방지)
  const xMode = isLeftEdgeMoving && !isRightEdgeMoving ? 'left' : !isLeftEdgeMoving && isRightEdgeMoving ? 'right' : 'none';
  const yMode = isTopEdgeMoving && !isBottomEdgeMoving ? 'top' : !isTopEdgeMoving && isBottomEdgeMoving ? 'bottom' : 'none';

  // 'none' 모드면 해당 축 snap 비활성화
  const xCandidates = xMode === 'left'
    ? [{ value: newBox.x, offset: 0 }]
    : xMode === 'right'
      ? [{ value: newRight, offset: newBox.width }]
      : []; // 'none' 모드: snap 비활성화

  const yCandidates = yMode === 'top'
    ? [{ value: newBox.y, offset: 0 }]
    : yMode === 'bottom'
      ? [{ value: newBottom, offset: newBox.height }]
      : []; // 'none' 모드: snap 비활성화

  const snapX = xCandidates.length > 0 ? getBestSnap(xCandidates, referenceXLines, thresholdPx) : null;
  const snapY = yCandidates.length > 0 ? getBestSnap(yCandidates, referenceYLines, thresholdPx) : null;

  const next: KonvaBox = { ...newBox };

  if (snapX) {
    if (xMode === 'left') {
      next.x = snapX.line;
      next.width = newRight - snapX.line;
    } else if (xMode === 'right') {
      next.width = snapX.line - newBox.x;
    }
    // 'none' 모드는 xCandidates가 비어있어 snapX가 null이므로 여기 도달하지 않음
  }

  if (snapY) {
    if (yMode === 'top') {
      next.y = snapY.line;
      next.height = newBottom - snapY.line;
    } else if (yMode === 'bottom') {
      next.height = snapY.line - newBox.y;
    }
    // 'none' 모드는 yCandidates가 비어있어 snapY가 null이므로 여기 도달하지 않음
  }

  return {
    box: next,
    guides: {
      verticalX: snapX ? snapX.line : null,
      horizontalY: snapY ? snapY.line : null,
    },
  };
}

type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
type EqualizeMode = 'width' | 'height' | 'both';

function getSelectionBoundingBox(fields: AddedField[]) {
  const minX = Math.min(...fields.map((f) => f.x));
  const minY = Math.min(...fields.map((f) => f.y));
  const maxX = Math.max(...fields.map((f) => f.x + f.width));
  const maxY = Math.max(...fields.map((f) => f.y + f.height));
  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: minX + (maxX - minX) / 2,
    centerY: minY + (maxY - minY) / 2,
  };
}

function isCheckboxType(field: AddedField): boolean {
  return field.type === FieldType.CHECKBOX;
}

function SelectionBoundingBox({
  fields,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  fields: AddedField[];
  onDragStart: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}) {
  const bbox = getSelectionBoundingBox(fields);
  const padding = FIELD_EDITOR_UI.multiSelect.bboxPaddingPx;
  const x = bbox.minX - padding;
  const y = bbox.minY - padding;
  const boxWidth = bbox.maxX - bbox.minX + padding * 2;
  const boxHeight = bbox.maxY - bbox.minY + padding * 2;

  const labelText = `${fields.length}개 선택됨`;
  const labelX = x;
  const labelY = Math.max(0, y - 20);
  const labelWidth = Math.max(90, labelText.length * 7 + 16);

  return (
    <React.Fragment>
      <Rect
        name="selection-bbox"
        x={x}
        y={y}
        width={boxWidth}
        height={boxHeight}
        fill={FIELD_EDITOR_UI.multiSelect.fill}
        stroke={FIELD_EDITOR_UI.multiSelect.stroke}
        strokeWidth={2}
        dash={[10, 6]}
        cornerRadius={6}
        listening={true}
        draggable={true}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={0}
        dragBoundFunc={() => ({ x, y })}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
      <Rect
        name="selection-bbox-label"
        x={labelX}
        y={labelY}
        width={labelWidth}
        height={18}
        fill={FIELD_EDITOR_UI.multiSelect.labelFill}
        cornerRadius={6}
        listening={true}
        draggable={true}
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={0}
        dragBoundFunc={() => ({ x: labelX, y: labelY })}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
      <Text
        x={labelX + 8}
        y={labelY + 2}
        width={labelWidth - 16}
        height={18}
        text={labelText}
        fontSize={12}
        fontStyle="bold"
        fill="#ffffff"
        verticalAlign="middle"
        listening={false}
      />
    </React.Fragment>
  );
}

function getCommonNumericValue(fields: AddedField[], selector: (field: AddedField) => number): number | null {
  if (fields.length === 0) return null;
  const firstValue = selector(fields[0]!);
  const allSame = fields.every((field) => selector(field) === firstValue);
  return allSame ? firstValue : null;
}

function parsePositiveNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  return parsed;
}

function parseNonNegativeNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0) return null;
  return parsed;
}

function getSelectionToolbarTop(
  selectionBox: { minY: number; maxY: number },
  selectionBoxPadding: number,
  toolbarHeightPx: number,
  toolbarMarginPx: number,
  toolbarOffsetPx: number,
  stageHeight: number
): number {
  const aboveTop = selectionBox.minY - selectionBoxPadding - toolbarHeightPx - toolbarMarginPx - toolbarOffsetPx;
  if (aboveTop >= 0) return aboveTop;

  const belowTop = selectionBox.maxY + selectionBoxPadding + toolbarMarginPx;
  const clampedBelow = Math.min(belowTop, Math.max(0, stageHeight - toolbarHeightPx - toolbarMarginPx));
  return clampedBelow;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function shouldIgnoreEditorShortcut(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

function getArrowDelta(key: string, step: number): { dx: number; dy: number } {
  if (key === 'arrowleft') return { dx: -step, dy: 0 };
  if (key === 'arrowright') return { dx: step, dy: 0 };
  if (key === 'arrowup') return { dx: 0, dy: -step };
  if (key === 'arrowdown') return { dx: 0, dy: step };
  return { dx: 0, dy: 0 };
}

function generateNextFieldKeyFromBase(fieldKey: string, existingKeys: Set<string>): string {
  const normalizedPrefix = extractFieldKeyPrefix(fieldKey);
  const prefixWithUnderscore = `${normalizedPrefix}_`;
  let maxNumber = 0;

  existingKeys.forEach((key) => {
    if (!key.startsWith(prefixWithUnderscore)) return;
    const lastPart = key.slice(prefixWithUnderscore.length);
    const number = Number(lastPart);
    if (Number.isFinite(number)) {
      maxNumber = Math.max(maxNumber, number);
    }
  });

  let nextNumber = maxNumber + 1;
  let candidate = `${prefixWithUnderscore}${String(nextNumber).padStart(3, '0')}`;
  while (existingKeys.has(candidate)) {
    nextNumber += 1;
    candidate = `${prefixWithUnderscore}${String(nextNumber).padStart(3, '0')}`;
  }

  return candidate;
}

function extractFieldKeyPrefix(fieldKey: string): string {
  const trimmedKey = fieldKey.trim();
  const match = trimmedKey.match(/^(.*)_\d+$/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmedKey || 'field';
}

function createOrderSeedByPage(fields: AddedField[]): Map<number, number> {
  const map = new Map<number, number>();
  fields.forEach((field) => {
    const nextOrder = (map.get(field.pageNumber) ?? 0) < field.order ? field.order : (map.get(field.pageNumber) ?? 0);
    map.set(field.pageNumber, nextOrder);
  });

  map.forEach((value, key) => {
    map.set(key, value + 1);
  });

  return map;
}

function getNextOrderForPage(map: Map<number, number>, pageNumber: number): number {
  const nextOrder = map.get(pageNumber) ?? 1;
  map.set(pageNumber, nextOrder + 1);
  return nextOrder;
}

