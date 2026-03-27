'use client';

import { useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useDocumentContext } from '../_contexts/DocumentContext';
import { resolveFieldValue, type ValueResolverContext } from '@/lib/field-value-resolvers';
import { FormRenderType } from '../_types/document-enums';
import type { components } from '@/generated/api/types';

type FormFieldDto = components['schemas']['FormFieldDto'];

export function DocumentFormHost({ children }: { children: React.ReactNode }) {
  const {
    formSnapshotRef,
    formResetRef,
    formBaselineRef,
    formDirtyRef,
    formSetValueRef,
    externalModifiedRef,
    loadedIssuance,
    selectedFormDetail,
    selectedPatient,
    appliedEncounters,
    initialFormData,
    formSyncKey,
  } = useDocumentContext();

  const form = useForm<Record<string, unknown>>({
    defaultValues: initialFormData,
    mode: 'onChange',
  });

  const { getValues, reset, formState, setValue } = form;

  // formState.isDirty를 ref로 유지하여 effect 재실행 방지
  const isDirtyRef = useRef(false);
  isDirtyRef.current = formState.isDirty;

  useEffect(function registerDocumentFormHandlers() {
    formSnapshotRef.current = () => {
      return getValues();
    };

    formResetRef.current = () => {
      externalModifiedRef.current = false;
      reset(formBaselineRef.current ?? {});
    };

    // isDirty 상태 확인 함수 등록 (RHF isDirty + 외부 수정 여부 결합)
    formDirtyRef.current = () => {
      return isDirtyRef.current || externalModifiedRef.current;
    };

    // react-hook-form setValue 함수 등록
    formSetValueRef.current = (fieldKey: string, value: unknown, options?: { shouldDirty?: boolean }) => {
      setValue(fieldKey, value, { shouldDirty: options?.shouldDirty ?? true });
    };

    return function cleanupDocumentFormHandlers() {
      formSnapshotRef.current = null;
      formResetRef.current = null;
      formDirtyRef.current = null;
      formSetValueRef.current = null;
    };
  }, [formBaselineRef, formResetRef, formSnapshotRef, formDirtyRef, formSetValueRef, getValues, reset, setValue]);

  // 폼 초기화 및 데이터 적용 (중앙 집중식 Context 데이터 기반)
  useEffect(function initializeFormValues() {
    formBaselineRef.current = initialFormData;
    reset(initialFormData);
  }, [formSyncKey, initialFormData, reset, formBaselineRef]);

  // 값 해결기로 필드 값 업데이트 (내원이력 등 클라이언트에서 동적으로 생성되는 값)
  useEffect(function applyValueResolvers() {
    const detail = selectedFormDetail;
    if (!detail) return;

    // 발급본이 있으면 스킵 (발급본 데이터 우선)
    const issuanceId = loadedIssuance?.issuanceId;
    const hasLoadedIssuance = typeof issuanceId === 'number' && issuanceId > 0;
    if (hasLoadedIssuance) return;

    // PDF 렌더 타입만 처리
    const isPdfRenderType = detail.renderType === FormRenderType.Pdf;
    if (!isPdfRenderType) return;

    const fields = detail.fields as unknown as FormFieldDto[];
    const context: ValueResolverContext = {
      appliedEncounters,
      selectedPatient,
    };

    fields.forEach((field) => {
      const resolvedValue = resolveFieldValue(field, context);
      if (resolvedValue !== null && resolvedValue !== undefined) {
        setValue(field.key, resolvedValue, { shouldDirty: false });
      }
    });
  }, [
    appliedEncounters,
    selectedPatient,
    selectedFormDetail,
    loadedIssuance?.issuanceId,
    setValue,
  ]);

  return <FormProvider {...form}>{children}</FormProvider>;
}


