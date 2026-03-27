'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { AddedField } from '@/types/document';
import { FieldType } from '@/types/document';
import { PdfWithFieldOverlay } from '@/app/document/_components/shared/PdfWithFieldOverlay';
import { buildRhfDefaultsFromFields } from '@/app/document/_utils/form-initialization';
import { convertAddedFieldsToFormFields } from '../_utils/field-conversion';
import { buildPreviewDefaultsFromFields } from '../_utils/preview-form-defaults';
import ubcareSealPng from '../_assets/유비케어.png';
import hongGildongPng from '../_assets/홍길동.png';

interface PdfSize {
  width: number;
  height: number;
}

// 미리보기 축소 비율
const PREVIEW_SCALE = 0.8;

interface FieldEditorPreviewPanelProps {
  pdfFile: File | Uint8Array;
  pdfSize: PdfSize;
  currentPage: number;
  fields: AddedField[];
  onClose: () => void;
}

export function FieldEditorPreviewPanel({
  pdfFile,
  pdfSize,
  currentPage,
  fields,
  onClose,
}: FieldEditorPreviewPanelProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // 축소된 크기 계산
  const scaledWidth = pdfSize.width * PREVIEW_SCALE;
  const scaledHeight = pdfSize.height * PREVIEW_SCALE;

  const formFields = useMemo(() => {
    // 미리보기에서는 id가 필요 없으므로 0으로 채움
    return convertAddedFieldsToFormFields(fields, new Map());
  }, [fields]);

  const mergedDefaults = useMemo(() => {
    const baseDefaults = buildRhfDefaultsFromFields(formFields);
    const previewDefaults = buildPreviewDefaultsFromFields(formFields);
    // baseDefaults(서버 defaultValue 등)가 있으면 그 값을 우선, 없으면 previewDefaults로 채움
    return { ...previewDefaults, ...baseDefaults };
  }, [formFields]);

  const form = useForm<Record<string, unknown>>({
    defaultValues: mergedDefaults,
    mode: 'onChange',
  });

  const { getValues, reset } = form;

  // fields/defaults 변경 시: 기존 입력값은 유지하면서, 새 필드는 기본값으로 채움
  useEffect(function syncPreviewFormDefaultsOnFieldsChange() {
    const currentValues = getValues();
    const nextValues = { ...mergedDefaults, ...currentValues };
    reset(nextValues);
  }, [getValues, mergedDefaults, reset]);

  return (
    <div className="shrink-0 pt-[5px]">
      {/* 미리보기 패널 전체를 감싸는 컨테이너 - 테두리로 구분 */}
      <div
        className="relative rounded-lg overflow-hidden ring-4 ring-emerald-500 shadow-lg"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {/* 원본 크기로 렌더링 후 축소 */}
        <div
          style={{
            width: pdfSize.width,
            height: pdfSize.height,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <FormProvider {...form}>
            <PdfWithFieldOverlay
              file={pdfFile}
              fields={formFields}
              currentPage={currentPage}
              onPageChangeAction={() => {}}
              onTotalPagesChangeAction={() => {}}
              isEditMode={mode === 'edit'}
              showNavigation={false}
              stampPlaceholder="[직인]"
              getImageFallbackSrcAction={(field) => {
                const dataSource: string = typeof field.dataSource === 'string' ? field.dataSource : '';
                if (field.type === FieldType.STAMP && dataSource === 'hospital.directorSealUuid') {
                  return getStaticImageSrc(ubcareSealPng);
                }
                if (field.type === FieldType.STAMP && dataSource === 'doctor.sealUuid') {
                  return getStaticImageSrc(hongGildongPng);
                }
                if (field.type === FieldType.SIGNATURE) {
                  return getStaticImageSrc(hongGildongPng);
                }
                if (field.type === FieldType.IMAGE) {
                  // IMAGE (병원장 이미지 등)
                  return getStaticImageSrc(hongGildongPng);
                }
                return undefined;
              }}
              preferFallbackImage={true}
            />
          </FormProvider>
        </div>

        {/* 상단 바 */}
        <div className="absolute top-2 left-2 right-2 z-10 pointer-events-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 rounded px-2 py-1 shadow-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              미리보기
            </div>

            <div className="flex items-center bg-white/90 rounded shadow-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`px-2 py-1 text-xs font-bold transition-colors ${mode === 'view' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                보기
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-2 py-1 text-xs font-bold transition-colors ${mode === 'edit' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                편집
              </button>
            </div>
          </div>

          <button type="button" onClick={onClose} className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded shadow-md transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function getStaticImageSrc(image: unknown): string {
  if (typeof image === 'string') return image;
  if (image && typeof image === 'object') {
    const src = (image as any).src;
    if (typeof src === 'string') return src;
  }
  return '';
}
