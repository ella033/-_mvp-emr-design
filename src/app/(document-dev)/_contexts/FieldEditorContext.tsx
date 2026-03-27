'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DataItem, AddedField } from '@/types/document';
import { FieldType } from '@/types/document';
import { FormsService } from '@/services/forms-service';
import { FileService } from '@/services/file-service';
import { convertAddedFieldsToFormFields, convertFormFieldsToAddedFields, validateDefaultValue } from '../_utils/field-conversion';


const STORAGE_KEY = 'field-editor-fields';
const DEFAULT_FIELD_FONT_SIZE = 15;
const DEFAULT_FIELD_HEIGHT = 25;
const DEFAULT_FIELD_WIDTH = 200;
const DATE_SPLIT_FIELD_WIDTHS = {
  year: 70,
  month: 48,
  day: 48,
  gap: 8,
} as const;

// 라디오 그룹 색상 팔레트
const RADIO_GROUP_COLORS = [
  { fill: "rgba(147, 51, 234, 0.15)", stroke: "rgba(147, 51, 234, 0.7)", fillSelected: "rgba(147, 51, 234, 0.2)", strokeSelected: "rgba(147, 51, 234, 0.9)" }, // 보라색
  { fill: "rgba(236, 72, 153, 0.15)", stroke: "rgba(236, 72, 153, 0.7)", fillSelected: "rgba(236, 72, 153, 0.2)", strokeSelected: "rgba(236, 72, 153, 0.9)" }, // 핑크색
  { fill: "rgba(59, 130, 246, 0.15)", stroke: "rgba(59, 130, 246, 0.7)", fillSelected: "rgba(59, 130, 246, 0.2)", strokeSelected: "rgba(59, 130, 246, 0.9)" }, // 파란색
  { fill: "rgba(16, 185, 129, 0.15)", stroke: "rgba(16, 185, 129, 0.7)", fillSelected: "rgba(16, 185, 129, 0.2)", strokeSelected: "rgba(16, 185, 129, 0.9)" }, // 초록색
  { fill: "rgba(245, 158, 11, 0.15)", stroke: "rgba(245, 158, 11, 0.7)", fillSelected: "rgba(245, 158, 11, 0.2)", strokeSelected: "rgba(245, 158, 11, 0.9)" }, // 노란색
  { fill: "rgba(239, 68, 68, 0.15)", stroke: "rgba(239, 68, 68, 0.7)", fillSelected: "rgba(239, 68, 68, 0.2)", strokeSelected: "rgba(239, 68, 68, 0.9)" }, // 빨간색
  { fill: "rgba(139, 92, 246, 0.15)", stroke: "rgba(139, 92, 246, 0.7)", fillSelected: "rgba(139, 92, 246, 0.2)", strokeSelected: "rgba(139, 92, 246, 0.9)" }, // 보라색2
  { fill: "rgba(20, 184, 166, 0.15)", stroke: "rgba(20, 184, 166, 0.7)", fillSelected: "rgba(20, 184, 166, 0.2)", strokeSelected: "rgba(20, 184, 166, 0.9)" }, // 청록색
];

interface FieldEditorContextType {
  selectedItem: DataItem | null;
  selectedField: AddedField | null;
  selectedFields: AddedField[]; // 다수 선택된 필드들
  addedFields: AddedField[];
  currentPage: number; // 현재 페이지 (1-indexed)
  numPages: number | undefined; // 전체 페이지 수
  pdfFile: File | Uint8Array | null; // 선택된 PDF 파일
  pdfFileName: string | null; // 선택된 PDF 파일명
  formName: string | null; // 서버에 등록된 서식 이름
  formVersionId: number | null; // 현재 편집 중인 서식 버전 ID
  isPreviewOpen: boolean;
  editingFormId: number | null; // 현재 편집 중인 서식 ID
  setSelectedItem: (item: DataItem | null) => void;
  setSelectedField: (field: AddedField | null) => void;
  setSelectedFields: (fields: AddedField[]) => void;
  setCurrentPage: (page: number) => void;
  setNumPages: (numPages: number | undefined) => void;
  setPdfFile: (file: File | null) => void;
  resetPdfFile: () => void;
  togglePreview: () => void;
  addField: (item: DataItem, pageNumber?: number, position?: { x: number; y: number }) => void;
  addFields: (fields: AddedField[]) => void;
  updateField: (field: AddedField) => void;
  updateFields: (fields: AddedField[]) => void;
  deleteField: (fieldKey: string) => void;
  deleteFields: (fieldKeys: string[]) => void; // 다수 필드 삭제
  clearFields: () => void;
  getFieldsByPage: (pageNumber: number) => AddedField[];
  getFieldsJsonString: () => string;
  saveFields: () => boolean; // 저장 함수 추가
  loadFields: () => boolean; // 불러오기 함수 추가
  setFieldsFromJson: (json: string) => { success: boolean; error?: string }; // JSON으로 필드 설정
  loadServerForm: (formId: number, formName: string) => Promise<{ success: boolean; error?: string }>; // 서버 서식 불러오기
  updateServerFormFields: () => Promise<{ success: boolean; error?: string }>; // 서버 서식 필드 업데이트
  setRadioGroup: (fieldKeys: string[], groupName?: string) => void; // 라디오 그룹 설정
  removeRadioGroup: (fieldKeys: string[]) => void; // 라디오 그룹 해제
  getRadioGroupColor: (groupName: string) => { fill: string; stroke: string; fillSelected: string; strokeSelected: string }; // 라디오 그룹 색상 가져오기
  getExistingRadioGroups: () => string[]; // 기존 라디오 그룹 목록 가져오기
  setScoreGroup: (fieldKeys: string[], totalFieldName?: string, totalFieldPageNumber?: number) => string | null; // 점수 그룹 설정 (총점 필드 자동 생성, 총점 필드 key 반환)
  removeScoreGroup: (fieldKeys: string[]) => void; // 점수 그룹 해제
  getExistingScoreGroups: () => string[]; // 기존 점수 그룹 목록 가져오기
  reorderFields: (pageNumber: number, orderedFieldKeys: string[]) => void; // 필드 순서 변경
}

const FieldEditorContext = createContext<FieldEditorContextType | undefined>(undefined);

export function FieldEditorProvider({ children }: { children: ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<DataItem | null>(null);
  const [selectedField, setSelectedField] = useState<AddedField | null>(null);
  const [selectedFields, setSelectedFields] = useState<AddedField[]>([]);
  const [addedFields, setAddedFields] = useState<AddedField[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number | undefined>(undefined);
  const [pdfFile, setPdfFileState] = useState<File | Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [formName, setFormName] = useState<string | null>(null);
  const [formVersionId, setFormVersionId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  // 필드 key -> 서버 필드 id 매핑 (서버에서 불러온 필드의 id를 저장)
  const [fieldIdMap, setFieldIdMap] = useState<Map<string, number>>(new Map());

  const setPdfFile = (file: File | null) => {
    if (file) {
      setPdfFileState(file);
      setPdfFileName(file.name);
      setFormName(null); // 새 PDF 파일 선택 시 서식 이름 초기화
      setFormVersionId(null); // 새 PDF 파일 선택 시 서식 버전 ID 초기화
      setEditingFormId(null); // 새 PDF 파일 선택 시 서식 ID 초기화
      setFieldIdMap(new Map()); // 필드 id 매핑 초기화
      // 새 PDF 파일 선택 시 페이지 초기화
      setCurrentPage(1);
      setNumPages(undefined);
    }
  };

  const resetPdfFile = () => {
    setPdfFileState(null);
    setPdfFileName(null);
    setFormName(null);
    setFormVersionId(null);
    setCurrentPage(1);
    setNumPages(undefined);
    setEditingFormId(null);
    setFieldIdMap(new Map());
    // PDF 삭제 시 필드도 함께 삭제
    setAddedFields([]);
    setSelectedField(null);
    setSelectedFields([]);
  };

  const togglePreview = () => {
    setIsPreviewOpen((prev) => !prev);
  };

  const addField = (item: DataItem, pageNumber?: number, position?: { x: number; y: number }) => {
    const targetPage = pageNumber ?? currentPage;

    const isDateSplitTemplate = Boolean(item.options?.dateSplit);
    if (isDateSplitTemplate) {
      const baseX = position?.x ?? 100;
      const baseY = position?.y ?? 100;
      const baseOrder = getNextOrderValue(addedFields, targetPage);
      const dateSplitGroupId = generateNextDateSplitGroupId(addedFields, item.keyPrefix);

      const dateParts = [
        { suffix: 'year', label: '년', width: DATE_SPLIT_FIELD_WIDTHS.year, placeholder: '년' },
        { suffix: 'month', label: '월', width: DATE_SPLIT_FIELD_WIDTHS.month, placeholder: '월' },
        { suffix: 'day', label: '일', width: DATE_SPLIT_FIELD_WIDTHS.day, placeholder: '일' },
      ] as const;

      const newFields: AddedField[] = [];
      dateParts.forEach((part, index) => {
        const partKeyPrefix = `${item.keyPrefix}_${part.suffix}`;
        const partKey = generateNextFieldKey(partKeyPrefix, [...addedFields, ...newFields]);

        newFields.push({
          key: partKey,
          name: `${item.name} (${part.label})`,
          type: FieldType.TEXT,
          pageNumber: targetPage,
          x: baseX + getDateSplitOffsetX(index),
          y: baseY,
          width: part.width,
          height: DEFAULT_FIELD_HEIGHT,
          fontSize: DEFAULT_FIELD_FONT_SIZE,
          fontWeight: 'normal',
          textAlign: 'center',
          order: baseOrder + index,
          dataSource: '',
          options: {
            placeholder: part.placeholder,
            dateSplit: {
              groupId: dateSplitGroupId,
              part: part.suffix,
              ui: 'select',
            },
          },
        });
      });

      setAddedFields((prev) => [...prev, ...newFields]);
      return;
    }

    const newFieldKey = generateNextFieldKey(item.keyPrefix, addedFields);
    const newOrder = getNextOrderValue(addedFields, targetPage);
    const isTextareaType = item.type === FieldType.TEXTAREA;
    const isCheckboxType = item.type === FieldType.CHECKBOX;
    const isDiagnosisTableType = item.type === FieldType.DIAGNOSIS_TABLE;
    const hasDateRangeOption = Boolean(item.options?.dateRange);

    // 체크박스 필드는 정사각형으로 설정
    const getFieldSize = () => {
      if (isCheckboxType) {
        return { width: 24, height: 24 };
      }
      if (isTextareaType) {
        return { width: 400, height: 80 };
      }
      if (isDiagnosisTableType) {
        return { width: 400, height: 200 };
      }
      if (hasDateRangeOption) {
        // 시작일(100) + 간격(8) + 구분자(20) + 간격(8) + 종료일(100) = 236
        return { width: 236, height: DEFAULT_FIELD_HEIGHT };
      }
      return { width: DEFAULT_FIELD_WIDTH, height: DEFAULT_FIELD_HEIGHT };
    };

    const fieldSize = getFieldSize();

    // 테이블 필드 초기 옵션 설정
    const getInitialOptions = () => {
      if (isDiagnosisTableType) {
        return {
          ...(item.options ?? {}),
          diagnosisTable: {
            nameColumnRatio: 0.5, // 상병명 컬럼 50%
            rowHeight: 20,
            rows: [] as Array<{ name: string; code: string }>,
          },
        };
      }
      return item.options ?? {};
    };

    // 위치가 지정된 경우 해당 위치 사용, 아니면 기본값 (100, 100)
    const fieldX = position?.x ?? 100;
    const fieldY = position?.y ?? 100;

    const newField: AddedField = {
      key: newFieldKey,
      name: item.name,
      type: item.type,
      pageNumber: targetPage,
      x: fieldX,
      y: fieldY,
      width: fieldSize.width,
      height: fieldSize.height,
      fontSize: DEFAULT_FIELD_FONT_SIZE,
      fontWeight: 'normal',
      textAlign: 'left',
      order: newOrder,
      dataSource: item.dataSource,
      options: getInitialOptions(),
    };
    setAddedFields((prev) => [...prev, newField]);
  };

  const addFields = (fields: AddedField[]) => {
    if (fields.length === 0) return;
    setAddedFields((prev) => [...prev, ...fields]);
  };

  const updateField = (updatedField: AddedField) => {
    setAddedFields((prev) =>
      prev.map((field) =>
        field.key === updatedField.key ? updatedField : field
      )
    );
    // 선택된 필드가 업데이트되면 선택 상태도 업데이트
    if (selectedField?.key === updatedField.key) {
      setSelectedField(updatedField);
    }
  };

  const updateFields = (updatedFields: AddedField[]) => {
    if (updatedFields.length === 0) return;
    const updatedFieldMap = new Map(updatedFields.map((f) => [f.key, f]));

    setAddedFields((prev) => prev.map((field) => updatedFieldMap.get(field.key) ?? field));

    setSelectedField((prev) => {
      if (!prev) return prev;
      return updatedFieldMap.get(prev.key) ?? prev;
    });

    setSelectedFields((prev) => prev.map((field) => updatedFieldMap.get(field.key) ?? field));
  };

  const deleteField = (fieldKey: string) => {
    setAddedFields((prev) => prev.filter((field) => field.key !== fieldKey));
    // 삭제된 필드가 선택된 필드면 선택 해제
    if (selectedField?.key === fieldKey) {
      setSelectedField(null);
    }
    // 다수 선택에서도 제거
    setSelectedFields((prev) => prev.filter((field) => field.key !== fieldKey));
  };

  const deleteFields = (fieldKeys: string[]) => {
    setAddedFields((prev) => prev.filter((field) => !fieldKeys.includes(field.key)));
    // 선택 해제
    if (selectedField && fieldKeys.includes(selectedField.key)) {
      setSelectedField(null);
    }
    setSelectedFields((prev) => prev.filter((field) => !fieldKeys.includes(field.key)));
  };

  const clearFields = () => {
    setAddedFields([]);
    setSelectedField(null);
    setSelectedFields([]);
  };

  const getFieldsByPage = (pageNumber: number): AddedField[] => {
    return addedFields.filter(field => field.pageNumber === pageNumber);
  };

  const getFieldsJsonString = (): string => {
    try {
      return JSON.stringify(addedFields, null, 2);
    } catch (err) {
      console.error('[FIELD-EDITOR] Failed to stringify fields:', err);
      return '[]';
    }
  };

  const saveFields = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(addedFields));
      console.log('[FIELD-STORAGE] Saved fields to localStorage:', addedFields);
      return true;
    } catch (error) {
      console.error('[FIELD-STORAGE] Failed to save fields to localStorage:', error);
      return false;
    }
  };

  const loadFields = (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      const savedFields = localStorage.getItem(STORAGE_KEY);
      if (savedFields) {
        const parsedFields: unknown = JSON.parse(savedFields);
        const migratedFields = migrateFields(parsedFields);
        setAddedFields(migratedFields);
        console.log('[FIELD-STORAGE] Loaded fields from localStorage:', migratedFields);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[FIELD-STORAGE] Failed to load fields from localStorage:', error);
      return false;
    }
  };

  const setFieldsFromJson = (json: string): { success: boolean; error?: string } => {
    try {
      const parsed: unknown = JSON.parse(json);
      const isArrayInput = Array.isArray(parsed);
      const hasFieldsProperty =
        !isArrayInput &&
        typeof parsed === 'object' &&
        parsed !== null &&
        Array.isArray((parsed as { fields?: unknown }).fields);

      if (!isArrayInput && !hasFieldsProperty) {
        return { success: false, error: 'JSON 배열 또는 { fields: [...] } 형태만 지원합니다.' };
      }

      const inputFields = isArrayInput
        ? (parsed as unknown[])
        : ((parsed as { fields?: unknown[] }).fields ?? []);
      const migratedFields = migrateFields(inputFields);

      setAddedFields(migratedFields);
      setSelectedField(null);
      setSelectedFields([]);
      setFieldIdMap(new Map());
      return { success: true };
    } catch (error) {
      console.error('[FIELD-EDITOR] Failed to parse JSON:', error);
      return { success: false, error: 'JSON 파싱에 실패했습니다.' };
    }
  };

  const loadServerForm = async (formId: number, formName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. 서식 상세 조회 (raw=true: 템플릿 치환 없이 원본 값 반환)
      const formDetail = await FormsService.getFormById(formId, { raw: true });

      // 2. PDF 파일 다운로드
      const pdfUuid = (formDetail.pdfFileInfo as { uuid?: string } | null)?.uuid;
      if (!pdfUuid) {
        return { success: false, error: 'PDF 파일 정보가 없습니다.' };
      }

      const { blob } = await FileService.downloadFileV2(pdfUuid);
      const arrayBuffer = await blob.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      // 3. FormFieldDto[] -> AddedField[] 변환 및 필드 id 매핑 생성
      const convertedFields = convertFormFieldsToAddedFields(formDetail.fields);
      const newFieldIdMap = new Map<string, number>();
      formDetail.fields.forEach((field) => {
        newFieldIdMap.set(field.key, field.id);
      });

      // 4. 상태 업데이트
      setPdfFileState(pdfBytes);
      setPdfFileName(`서식 #${formId}`);
      setFormName(formName);
      setFormVersionId(formDetail.formVersionId);
      setAddedFields(convertedFields);
      setFieldIdMap(newFieldIdMap);
      setCurrentPage(1);
      setNumPages(undefined);
      setEditingFormId(formId);
      setSelectedField(null);
      setSelectedFields([]);

      console.log('[FIELD-EDITOR] Loaded server form:', formId, convertedFields);
      return { success: true };
    } catch (error) {
      console.error('[FIELD-EDITOR] Failed to load server form:', error);
      return { success: false, error: '서식을 불러오는데 실패했습니다.' };
    }
  };

  const updateServerFormFields = async (): Promise<{ success: boolean; error?: string }> => {
    if (!formVersionId) {
      return { success: false, error: '서식 버전 정보가 없습니다.' };
    }

    try {
      // AddedField[] -> FormFieldDto[] 변환
      const formFields = convertAddedFieldsToFormFields(addedFields, fieldIdMap);

      // FIXME: 임시로 ForAdmin API 사용 중이며, 추후 삭제 예정
      await FormsService.bulkUpdateFormFieldsForAdmin({
        formVersionId,
        fields: formFields,
      });

      console.log('[FIELD-EDITOR] Updated server form fields:', formVersionId, formFields);
      return { success: true };
    } catch (error) {
      console.error('[FIELD-EDITOR] Failed to update server form fields:', error);
      return { success: false, error: '서식 필드 업데이트에 실패했습니다.' };
    }
  };

  // 라디오 그룹 이름 자동 생성
  function generateNextRadioGroupName(fields: AddedField[]): string {
    const existingGroups = new Set<string>();
    fields.forEach((field) => {
      if (field.options?.radioGroup && typeof field.options.radioGroup === 'string') {
        existingGroups.add(field.options.radioGroup);
      }
    });

    let groupNumber = 1;
    while (existingGroups.has(`group${groupNumber}`)) {
      groupNumber++;
    }
    return `group${groupNumber}`;
  }

  // 라디오 그룹 설정
  const setRadioGroup = (fieldKeys: string[], groupName?: string) => {
    // 그룹 이름을 미리 계산하여 두 setter 간 일관성 보장
    const groupNameToUse = groupName || generateNextRadioGroupName(addedFields);
    let validationPassed = false;

    setAddedFields((prev) => {
      const targetFields = prev.filter((field) => fieldKeys.includes(field.key));
      const isAllCheckbox = targetFields.every((field) => field.type === FieldType.CHECKBOX);

      if (!isAllCheckbox) {
        console.warn('[FIELD-EDITOR] Only checkbox fields can be set as radio group');
        return prev;
      }

      validationPassed = true;

      return prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          return {
            ...field,
            options: {
              ...(field.options ?? {}),
              radioGroup: groupNameToUse,
            },
          };
        }
        return field;
      });
    });

    // 선택 상태 업데이트 (유효성 검사 통과 시에만)
    if (validationPassed) {
      setSelectedFields((prev) =>
        prev.map((field) => {
          if (fieldKeys.includes(field.key)) {
            return {
              ...field,
              options: {
                ...(field.options ?? {}),
                radioGroup: groupNameToUse,
              },
            };
          }
          return field;
        })
      );
    }
  };

  // 라디오 그룹 해제
  const removeRadioGroup = (fieldKeys: string[]) => {
    setAddedFields((prev) =>
      prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          const { radioGroup, ...restOptions } = field.options ?? {};
          return {
            ...field,
            options: Object.keys(restOptions).length > 0 ? restOptions : undefined,
          };
        }
        return field;
      })
    );

    // 선택 상태 업데이트
    setSelectedFields((prev) =>
      prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          const { radioGroup, ...restOptions } = field.options ?? {};
          return {
            ...field,
            options: Object.keys(restOptions).length > 0 ? restOptions : undefined,
          };
        }
        return field;
      })
    );
  };

  // 라디오 그룹 색상 가져오기
  const getRadioGroupColor = (groupName: string): { fill: string; stroke: string; fillSelected: string; strokeSelected: string } => {
    // 그룹 이름을 해시하여 색상 인덱스 결정
    let hash = 0;
    for (let i = 0; i < groupName.length; i++) {
      hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % RADIO_GROUP_COLORS.length;
    const color = RADIO_GROUP_COLORS[colorIndex];
    if (color) {
      return color;
    }
    // 폴백: 첫 번째 색상 (실제로는 발생하지 않아야 함)
    return RADIO_GROUP_COLORS[0] ?? {
      fill: "rgba(147, 51, 234, 0.15)",
      stroke: "rgba(147, 51, 234, 0.7)",
      fillSelected: "rgba(147, 51, 234, 0.2)",
      strokeSelected: "rgba(147, 51, 234, 0.9)",
    };
  };

  // 점수 그룹 이름 자동 생성
  function generateNextScoreGroupName(fields: AddedField[]): string {
    const existingGroups = new Set<string>();
    fields.forEach((field) => {
      if (field.options?.scoreGroup && typeof field.options.scoreGroup === 'string') {
        existingGroups.add(field.options.scoreGroup);
      }
    });

    let groupNumber = 1;
    while (existingGroups.has(`scoreGroup_${groupNumber}`)) {
      groupNumber++;
    }
    return `scoreGroup_${groupNumber}`;
  }

  // 점수 그룹 설정
  const setScoreGroup = (fieldKeys: string[], totalFieldName?: string, totalFieldPageNumber?: number): string | null => {
    let createdTotalFieldKey: string | null = null;
    // 그룹 이름은 setAddedFields 내부에서 prev를 사용하여 계산 (stale closure 방지)
    let groupNameToUse = '';
    let validationPassed = false;

    setAddedFields((prev) => {
      const targetFields = prev.filter((field) => fieldKeys.includes(field.key));
      const isAllCheckbox = targetFields.every((field) => field.type === FieldType.CHECKBOX);

      if (!isAllCheckbox) {
        console.warn('[FIELD-EDITOR] Only checkbox fields can be set as score group');
        return prev;
      }

      validationPassed = true;

      // prev를 사용하여 그룹 이름 계산 (최신 상태 기반)
      groupNameToUse = generateNextScoreGroupName(prev);

      // 총점 필드 생성
      const firstCheckbox = targetFields[0];
      const targetPage = totalFieldPageNumber ?? firstCheckbox?.pageNumber ?? currentPage;
      const totalFieldNameToUse = totalFieldName || '총점';

      // 총점 필드 위치 계산 (첫 번째 체크박스 아래)
      const totalFieldX = firstCheckbox?.x ?? 100;
      const totalFieldY = firstCheckbox ? firstCheckbox.y + firstCheckbox.height + 20 : 150;

      // 총점 필드 key 생성
      const totalFieldKey = generateNextFieldKey('total_score', prev);
      createdTotalFieldKey = totalFieldKey;

      // 총점 필드 생성
      const totalFieldOrder = getNextOrderValue(prev, targetPage);
      const totalField: AddedField = {
        key: totalFieldKey,
        name: totalFieldNameToUse,
        type: FieldType.NUMBER,
        pageNumber: targetPage,
        x: totalFieldX,
        y: totalFieldY,
        width: 200,
        height: 30,
        fontSize: 12,
        fontWeight: 'normal',
        textAlign: 'left',
        order: totalFieldOrder,
        dataSource: '',
        options: {
          scoreGroup: groupNameToUse,
        },
      };

      // 체크박스들에 scoreGroup 적용
      const updatedFields = prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          return {
            ...field,
            options: {
              ...(field.options ?? {}),
              scoreGroup: groupNameToUse,
            },
          };
        }
        return field;
      });

      return [...updatedFields, totalField];
    });

    // 선택 상태 업데이트 (유효성 검사 통과 시에만)
    if (validationPassed) {
      setSelectedFields((prev) =>
        prev.map((field) => {
          if (fieldKeys.includes(field.key)) {
            return {
              ...field,
              options: {
                ...(field.options ?? {}),
                scoreGroup: groupNameToUse,
              },
            };
          }
          return field;
        })
      );
    }

    return createdTotalFieldKey;
  };

  // 점수 그룹 해제
  const removeScoreGroup = (fieldKeys: string[]) => {
    setAddedFields((prev) => {
      // 체크박스에서 scoreGroup 제거
      const updatedFields = prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          const { scoreGroup, ...restOptions } = field.options ?? {};
          return {
            ...field,
            options: Object.keys(restOptions).length > 0 ? restOptions : undefined,
          };
        }
        return field;
      });

      // 총점 필드 찾기 및 제거
      const checkboxFields = prev.filter((field) => fieldKeys.includes(field.key));
      const scoreGroups = new Set<string>();
      checkboxFields.forEach((field) => {
        if (field.options?.scoreGroup && typeof field.options.scoreGroup === 'string') {
          scoreGroups.add(field.options.scoreGroup);
        }
      });

      // 같은 scoreGroup을 가진 총점 필드 제거
      return updatedFields.filter((field) => {
        if (field.type === FieldType.NUMBER && field.options?.scoreGroup) {
          const fieldScoreGroup = field.options.scoreGroup as string;
          return !scoreGroups.has(fieldScoreGroup);
        }
        return true;
      });
    });

    // 선택 상태 업데이트
    setSelectedFields((prev) =>
      prev.map((field) => {
        if (fieldKeys.includes(field.key)) {
          const { scoreGroup, ...restOptions } = field.options ?? {};
          return {
            ...field,
            options: Object.keys(restOptions).length > 0 ? restOptions : undefined,
          };
        }
        return field;
      })
    );
  };

  // 기존 라디오 그룹 목록 가져오기
  const getExistingRadioGroups = useCallback((): string[] => {
    const radioGroups = new Set<string>();
    addedFields.forEach((field) => {
      if (field.type === FieldType.CHECKBOX) {
        const radioGroup = field.options?.radioGroup;
        if (radioGroup && typeof radioGroup === 'string') {
          radioGroups.add(radioGroup);
        }
      }
    });
    return Array.from(radioGroups).sort();
  }, [addedFields]);

  // 기존 점수 그룹 목록 가져오기
  const getExistingScoreGroups = useCallback((): string[] => {
    const scoreGroups = new Set<string>();
    addedFields.forEach((field) => {
      if (field.type === FieldType.CHECKBOX || field.type === FieldType.NUMBER) {
        const scoreGroup = field.options?.scoreGroup;
        if (scoreGroup && typeof scoreGroup === 'string') {
          scoreGroups.add(scoreGroup);
        }
      }
    });
    return Array.from(scoreGroups).sort();
  }, [addedFields]);

  // 필드 순서 변경
  const reorderFields = useCallback((pageNumber: number, orderedFieldKeys: string[]) => {
    setAddedFields((prev) => {
      // 해당 페이지의 필드들의 order를 새로운 순서에 맞게 업데이트
      return prev.map((field) => {
        if (field.pageNumber !== pageNumber) return field;

        const newOrderIndex = orderedFieldKeys.indexOf(field.key);
        if (newOrderIndex === -1) return field;

        return {
          ...field,
          order: newOrderIndex + 1, // order는 1부터 시작
        };
      });
    });
  }, []);

  return (
    <FieldEditorContext.Provider
      value={{
        selectedItem,
        selectedField,
        selectedFields,
        addedFields,
        currentPage,
        numPages,
        pdfFile,
        pdfFileName,
        formName,
        formVersionId,
        isPreviewOpen,
        editingFormId,
        setSelectedItem,
        setSelectedField,
        setSelectedFields,
        setCurrentPage,
        setNumPages,
        setPdfFile,
        resetPdfFile,
        togglePreview,
        addField,
        addFields,
        updateField,
        updateFields,
        deleteField,
        deleteFields,
        clearFields,
        getFieldsByPage,
        getFieldsJsonString,
        saveFields,
        loadFields,
        setFieldsFromJson,
        loadServerForm,
        updateServerFormFields,
        setRadioGroup,
        removeRadioGroup,
        getRadioGroupColor,
        getExistingRadioGroups,
        setScoreGroup,
        removeScoreGroup,
        getExistingScoreGroups,
        reorderFields,
      }}
    >
      {children}
    </FieldEditorContext.Provider>
  );
}

function generateNextFieldKey(keyPrefix: string, fields: AddedField[]): string {
  const normalizedPrefix = keyPrefix.trim();
  const prefixWithUnderscore = `${normalizedPrefix}_`;

  const existingNumbers = fields
    .map((f) => f.key)
    .filter((key) => key.startsWith(prefixWithUnderscore))
    .map((key) => {
      const lastPart = key.slice(prefixWithUnderscore.length);
      const number = Number(lastPart);
      return Number.isFinite(number) ? number : null;
    })
    .filter((n): n is number => n !== null);

  const nextNumber = (existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1;
  return `${prefixWithUnderscore}${String(nextNumber).padStart(3, '0')}`;
}

function getNextOrderValue(fields: AddedField[], pageNumber: number): number {
  const pageOrders = fields.filter((f) => f.pageNumber === pageNumber).map((f) => f.order);
  const maxOrder = pageOrders.length > 0 ? Math.max(...pageOrders) : 0;
  return maxOrder + 1;
}

function generateNextDateSplitGroupId(fields: AddedField[], basePrefix: string): string {
  const groupPrefix = `${basePrefix}_group_`;
  const existingNumbers = fields
    .map((field) => field.options?.dateSplit)
    .filter((dateSplit): dateSplit is { groupId?: unknown } => Boolean(dateSplit))
    .map((dateSplit) => dateSplit.groupId)
    .filter((groupId): groupId is string => typeof groupId === 'string' && groupId.startsWith(groupPrefix))
    .map((groupId) => {
      const suffix = groupId.slice(groupPrefix.length);
      const number = Number(suffix);
      return Number.isFinite(number) ? number : null;
    })
    .filter((number): number is number => number !== null);

  const nextNumber = (existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1;
  return `${groupPrefix}${String(nextNumber).padStart(3, '0')}`;
}

function getDateSplitOffsetX(index: number): number {
  if (index === 0) return 0;
  if (index === 1) return DATE_SPLIT_FIELD_WIDTHS.year + DATE_SPLIT_FIELD_WIDTHS.gap;
  return DATE_SPLIT_FIELD_WIDTHS.year + DATE_SPLIT_FIELD_WIDTHS.gap + DATE_SPLIT_FIELD_WIDTHS.month + DATE_SPLIT_FIELD_WIDTHS.gap;
}

function migrateFields(input: unknown): AddedField[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((raw, idx) => {
      const hasNewShape = typeof raw.key === 'string';
      if (hasNewShape) {
        return normalizeNewShape(raw);
      }

      return normalizeLegacyShape(raw, idx);
    })
    .filter((f): f is AddedField => f !== null);
}

function normalizeNewShape(raw: Record<string, unknown>): AddedField | null {
  const key = typeof raw.key === 'string' ? raw.key : null;
  if (!key) return null;

  const pageNumber = typeof raw.pageNumber === 'number' ? raw.pageNumber : 1;

  return {
    key,
    name: typeof raw.name === 'string' ? raw.name : key,
    type: typeof raw.type === 'number' ? (raw.type as FieldType) : FieldType.TEXT,
    pageNumber,
    x: typeof raw.x === 'number' ? raw.x : 0,
    y: typeof raw.y === 'number' ? raw.y : 0,
    width: typeof raw.width === 'number' ? raw.width : DEFAULT_FIELD_WIDTH,
    height: typeof raw.height === 'number' ? raw.height : DEFAULT_FIELD_HEIGHT,
    fontSize: typeof raw.fontSize === 'number' ? raw.fontSize : DEFAULT_FIELD_FONT_SIZE,
    fontWeight: raw.fontWeight === 'bold' ? 'bold' : 'normal',
    textAlign: raw.textAlign === 'center' || raw.textAlign === 'right' ? (raw.textAlign as any) : 'left',
    order: typeof raw.order === 'number' ? raw.order : 1,
    dataSource: typeof raw.dataSource === 'string' ? raw.dataSource : '',
    options: typeof raw.options === 'object' && raw.options !== null ? (raw.options as any) : {},
    defaultValue: validateDefaultValue(raw.defaultValue),
  };
}

function normalizeLegacyShape(raw: Record<string, unknown>, idx: number): AddedField | null {
  const legacyId = typeof raw.id === 'string' ? raw.id : null;
  const name = typeof raw.name === 'string' ? raw.name : legacyId ?? `field_${idx + 1}`;
  const pageNumber = typeof raw.pageNumber === 'number' ? raw.pageNumber : 1;
  const legacyType = typeof raw.type === 'string' ? raw.type : null;

  const fieldType = mapLegacyTypeToFieldType(legacyType);

  return {
    key: legacyId ?? `field_${String(idx + 1).padStart(3, '0')}`,
    name,
    type: fieldType,
    pageNumber,
    x: typeof raw.x === 'number' ? raw.x : 0,
    y: typeof raw.y === 'number' ? raw.y : 0,
    width: typeof raw.width === 'number' ? raw.width : DEFAULT_FIELD_WIDTH,
    height: typeof raw.height === 'number' ? raw.height : DEFAULT_FIELD_HEIGHT,
    fontSize: typeof raw.fontSize === 'number' ? raw.fontSize : DEFAULT_FIELD_FONT_SIZE,
    fontWeight: 'normal',
    textAlign: 'left',
    order: idx + 1,
    dataSource: '',
    options: {},
    defaultValue: undefined,
  };
}

function mapLegacyTypeToFieldType(legacyType: string | null): FieldType {
  const isText = legacyType === 'text';
  const isNumber = legacyType === 'number';
  const isDate = legacyType === 'date';

  if (isNumber) return FieldType.NUMBER;
  if (isDate) return FieldType.DATE;
  if (isText) return FieldType.TEXT;
  return FieldType.TEXT;
}

export function useFieldEditor() {
  const context = useContext(FieldEditorContext);
  if (context === undefined) {
    throw new Error('useFieldEditor must be used within FieldEditorProvider');
  }
  return context;
}
