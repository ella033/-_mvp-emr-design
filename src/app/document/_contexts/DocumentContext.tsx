'use client';

import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode, useMemo } from 'react';
import type { Patient } from '@/types/patient-types';
import type { Encounter } from '@/types/chart/encounter-types';
import type { components } from '@/generated/api/types';
import { mapFormDataToSnapshot } from '../_utils/form-data-mapper';
import { buildRhfDefaultsFromFields } from '../_utils/form-initialization';
import { FormRenderType, DocumentRenderViewType } from '../_types/document-enums';

type GetFormByIdResponseDto = components['schemas']['GetFormByIdResponseDto'];
type IssuanceStatus = components['schemas']['IssuanceStatus'];
type FormFieldDto = components['schemas']['FormFieldDto'];

export type LoadedFormIssuance = {
  issuanceId: number;
  status: IssuanceStatus;
  formId: number;
  formVersionId: number;
  formData: unknown;
};

export type DocumentFormMode = 'view' | 'edit';

export type DocumentRenderState =
  | { type: DocumentRenderViewType.Idle }
  | { type: DocumentRenderViewType.Loading }
  | { type: DocumentRenderViewType.Error; errorMessage: string }
  | { type: DocumentRenderViewType.Pdf; pdfUrl: string }
  | { type: DocumentRenderViewType.Component; componentKey: string };

// 폼 변경 확인 다이얼로그 관련 타입
export type PendingChange =
  | { type: 'patient'; patient: Patient | null }
  | { type: 'form'; formId: number | null }
  | { type: 'navigation'; url: string }
  | null;

interface DocumentContextType {
  selectedFormId: number | null;
  setSelectedFormId: (formId: number | null) => void;
  selectedFormDetail: GetFormByIdResponseDto | null;
  setSelectedFormDetail: (detail: GetFormByIdResponseDto | null) => void;
  loadedIssuance: LoadedFormIssuance | null;
  setLoadedIssuance: (issuance: LoadedFormIssuance | null) => void;
  formMode: DocumentFormMode;
  setFormMode: (mode: DocumentFormMode) => void;
  renderState: DocumentRenderState;
  setRenderState: (state: DocumentRenderState) => void;
  pdfObjectUrlRef: React.MutableRefObject<string | null>;
  appliedEncounters: Encounter[];
  setAppliedEncounters: (encounters: Encounter[]) => void;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  selectedEncounter: Encounter | null;
  setSelectedEncounter: (encounter: Encounter | null) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  margin: number;
  setMargin: (margin: number) => void;
  formResetRef: React.MutableRefObject<(() => void) | null>;
  formSnapshotRef: React.MutableRefObject<(() => unknown) | null>;
  formBaselineRef: React.MutableRefObject<Record<string, unknown> | null>;
  // 폼 dirty 상태 관련
  formDirtyRef: React.MutableRefObject<(() => boolean) | null>;
  // react-hook-form setValue 함수 참조
  formSetValueRef: React.MutableRefObject<((fieldKey: string, value: unknown, options?: { shouldDirty?: boolean }) => void) | null>;
  // 마지막 포커스된 필드 추적
  lastFocusedFieldRef: React.MutableRefObject<{
    fieldKey: string;
    element: HTMLElement | null;
    timestamp: number;
  } | null>;
  // 변경 확인 다이얼로그 관련
  pendingChange: PendingChange;
  setPendingChange: (change: PendingChange) => void;
  confirmPendingChange: () => void;
  cancelPendingChange: () => void;
  // dirty 체크 포함 환자/서식 변경 함수
  trySetSelectedPatient: (patient: Patient | null) => void;
  trySetSelectedFormId: (formId: number | null) => void;
  // 폼 외부 수정 여부 (내원이력 수동 적용 등 RHF 외부에서 발생하는 변경 추적)
  externalModifiedRef: React.MutableRefObject<boolean>;
  // 중앙 집중식 폼 초기화 데이터
  initialFormData: Record<string, unknown>;
  formSyncKey: string;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [selectedFormDetail, setSelectedFormDetail] =
    useState<GetFormByIdResponseDto | null>(null);
  const [loadedIssuance, setLoadedIssuance] = useState<LoadedFormIssuance | null>(null);
  const [formMode, setFormMode] = useState<DocumentFormMode>('edit');
  const [renderState, setRenderState] = useState<DocumentRenderState>({
    type: DocumentRenderViewType.Idle,
  });
  const pdfObjectUrlRef = useRef<string | null>(null);
  const [appliedEncounters, setAppliedEncounters] = useState<Encounter[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [margin, setMargin] = useState(15);
  const formResetRef = useRef<(() => void) | null>(null);
  const formSnapshotRef = useRef<(() => unknown) | null>(null);
  const formBaselineRef = useRef<Record<string, unknown> | null>(null);
  // 폼 dirty 상태 확인용 ref
  const formDirtyRef = useRef<(() => boolean) | null>(null);
  // react-hook-form setValue 함수 참조용 ref
  const formSetValueRef = useRef<((fieldKey: string, value: unknown, options?: { shouldDirty?: boolean }) => void) | null>(null);
  // 마지막 포커스된 필드 추적용 ref
  const lastFocusedFieldRef = useRef<{
    fieldKey: string;
    element: HTMLElement | null;
    timestamp: number;
  } | null>(null);
  // 폼 외부 수정 여부 (내원이력 수동 적용 등)
  const externalModifiedRef = useRef(false);
  // 변경 확인 다이얼로그용 pending 상태
  const [pendingChange, setPendingChange] = useState<PendingChange>(null);

  // pending 변경 확인 (다이얼로그에서 "예" 선택)
  const confirmPendingChange = useCallback(() => {
    if (!pendingChange) return;

    if (pendingChange.type === 'patient') {
      setSelectedPatient(pendingChange.patient);
      setSelectedEncounter(null);
    } else if (pendingChange.type === 'form') {
      setSelectedFormId(pendingChange.formId);
    } else if (pendingChange.type === 'navigation') {
      // 네비게이션 허용 - 직접 이동
      window.location.href = pendingChange.url;
    }

    setPendingChange(null);
  }, [pendingChange]);

  // pending 변경 취소 (다이얼로그에서 "아니오" 선택)
  const cancelPendingChange = useCallback(() => {
    setPendingChange(null);
  }, []);

  // dirty 체크 포함 환자 변경 시도
  const trySetSelectedPatient = useCallback((patient: Patient | null) => {
    const isDirty = formDirtyRef.current?.() ?? false;

    if (isDirty) {
      setPendingChange({ type: 'patient', patient });
      return;
    }

    setSelectedPatient(patient);
    setSelectedEncounter(null);
  }, []);

  // dirty 체크 포함 서식 변경 시도
  const trySetSelectedFormId = useCallback((formId: number | null) => {
    const isDirty = formDirtyRef.current?.() ?? false;

    if (isDirty) {
      setPendingChange({ type: 'form', formId });
      return;
    }

    setSelectedFormId(formId);
  }, []);

  // 중앙 집중식 폼 초기 데이터 계산
  const initialFormData = useMemo(() => {
    if (loadedIssuance) {
      const { values } = mapFormDataToSnapshot(loadedIssuance.formData);
      return (values as Record<string, unknown>) ?? {};
    }
    if (selectedFormDetail && selectedFormDetail.renderType === FormRenderType.Pdf) {
      return buildRhfDefaultsFromFields(selectedFormDetail.fields as unknown as FormFieldDto[]);
    }
    return {};
  }, [loadedIssuance, selectedFormDetail]);

  // 폼 하드 리셋을 트리거할 키 (환자, 서식, 혹은 특정 발급이력이 바뀔 때)
  const formSyncKey = useMemo(() => {
    return `${selectedPatient?.id ?? 'no-patient'}-${selectedFormId ?? 'no-form'}-${loadedIssuance?.issuanceId ?? 'new'}`;
  }, [selectedPatient?.id, selectedFormId, loadedIssuance?.issuanceId]);

  // 서식 변경 시 적용된 내원이력 및 관련 상태 초기화
  const prevFormIdRef = useRef<number | null>(null);
  useEffect(function resetFormStateOnFormChange() {
    const isFormChanged = prevFormIdRef.current !== null && prevFormIdRef.current !== selectedFormId;
    prevFormIdRef.current = selectedFormId;

    if (!isFormChanged) return;

    setAppliedEncounters([]);
    setSelectedEncounter(null);
    externalModifiedRef.current = false;

    // 현재 로드된 이력이 바뀐 서식과 관계없을 때만 초기화
    setLoadedIssuance((prev) => {
      if (prev && prev.formId === selectedFormId) return prev;
      return null;
    });
  }, [selectedFormId]);

  // 환자 변경 시 적용된 내원이력 및 관련 상태 초기화
  const prevPatientIdRef = useRef<number | null>(null);
  useEffect(function resetFormStateOnPatientChange() {
    const patientId = selectedPatient?.id ?? null;
    const isPatientChanged = prevPatientIdRef.current !== null && prevPatientIdRef.current !== patientId;
    prevPatientIdRef.current = patientId;

    if (!isPatientChanged) return;

    setAppliedEncounters([]);
    setSelectedEncounter(null);
    setLoadedIssuance(null);
    externalModifiedRef.current = false;
  }, [selectedPatient?.id]);

  return (
    <DocumentContext.Provider
      value={{
        selectedFormId,
        setSelectedFormId,
        selectedFormDetail,
        setSelectedFormDetail,
        loadedIssuance,
        setLoadedIssuance,
        formMode,
        setFormMode,
        renderState,
        setRenderState,
        pdfObjectUrlRef,
        appliedEncounters,
        setAppliedEncounters,
        selectedPatient,
        setSelectedPatient,
        selectedEncounter,
        setSelectedEncounter,
        zoomLevel,
        setZoomLevel,
        totalPages,
        setTotalPages,
        currentPage,
        setCurrentPage,
        margin,
        setMargin,
        formResetRef,
        formSnapshotRef,
        formBaselineRef,
        formDirtyRef,
        formSetValueRef,
        lastFocusedFieldRef,
        externalModifiedRef,
        pendingChange,
        setPendingChange,
        confirmPendingChange,
        cancelPendingChange,
        trySetSelectedPatient,
        trySetSelectedFormId,
        initialFormData,
        formSyncKey,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocumentContext() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
}

