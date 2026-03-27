'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import { PrintableDocument, PAPER_SIZES } from '@/lib/printable';
import { useDocumentContext } from '@/app/document/_contexts/DocumentContext';

interface TestRow {
  id: string;
  title: string;
  description: string;
}

interface VariableRowHeightFormData {
  rows: TestRow[];
}

const textareaClassName =
  'printable-edit-only w-full bg-transparent border border-slate-300 px-2 py-1 text-[11px] leading-snug text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 rounded-sm resize-none overflow-hidden';

export function VariableRowHeightTestContent() {
  const {
    margin,
    setTotalPages,
    currentPage,
    formBaselineRef,
  } = useDocumentContext();
  const form = useFormContext<VariableRowHeightFormData>();
  const { control, watch, reset, getValues } = form;

  const initialRows = useMemo(() => {
    const descriptions = [
      '짧은 텍스트',
      '중간 길이의 텍스트입니다. 이 텍스트는 두 줄 정도가 될 것입니다.',
      '매우 긴 텍스트입니다. 이 텍스트는 여러 줄에 걸쳐 표시되어 행 높이가 크게 증가할 것입니다. 실제 서식에서 사용되는 긴 설명이나 메모를 시뮬레이션하기 위해 충분한 길이의 텍스트를 포함하고 있습니다. 이렇게 긴 텍스트가 포함된 행은 페이지 경계에서 올바르게 나뉘어야 합니다. 추가로 더 많은 텍스트를 포함하여 행 높이를 더욱 증가시킵니다.',
    ];
    return Array.from({ length: 20 }).map((_, index) => ({
      id: randomUUID(),
      title: `항목 ${index + 1}`,
      description: descriptions[index % descriptions.length] ?? '',
    }));
  }, []);

  const defaultValues: VariableRowHeightFormData = useMemo(() => ({
    rows: initialRows,
  }), [initialRows]);

  const { fields } = useFieldArray({
    control,
    name: 'rows',
  });

  const formValues = watch();

  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const heightRef = useRef<Map<string, number>>(new Map());

  useEffect(function initializeDefaultValuesIfEmpty() {
    const currentValues = getValues();
    const isEmpty =
      !currentValues ||
      typeof currentValues !== 'object' ||
      Object.keys(currentValues as Record<string, unknown>).length === 0;

    if (!isEmpty) return;

    formBaselineRef.current = defaultValues as unknown as Record<string, unknown>;
    reset(defaultValues);
  }, [defaultValues, formBaselineRef, getValues, reset]);

  const isTextareaVisible = (element: HTMLTextAreaElement | null) => {
    if (!element) {
      return false;
    }

    const hasOffsetParent = element.offsetParent !== null;
    const hasClientRects = element.getClientRects().length > 0;

    return hasOffsetParent || hasClientRects;
  };

  const measureTextarea = (rowId: string, textarea: HTMLTextAreaElement) => {
    if (!isTextareaVisible(textarea)) {
      return;
    }

    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;
    heightRef.current.set(rowId, newHeight);
  };

  const applyStoredHeight = (rowId: string, textarea: HTMLTextAreaElement) => {
    const stored = heightRef.current.get(rowId);
    if (typeof stored === 'number') {
      textarea.style.height = `${stored}px`;
    } else {
      measureTextarea(rowId, textarea);
    }
  };

  // form 값 변경 시 textarea 높이 재측정 (debounce)
  useEffect(function remeasureAllTextareasOnValueChange() {
    const timeoutId = setTimeout(() => {
      // 모든 textarea 높이 재측정
      textareaRefs.current.forEach((textarea, rowId) => {
        measureTextarea(rowId, textarea);
      });
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [formValues.rows]);

  useEffect(function applyTextareaHeightsOnPageChange() {
    const raf = requestAnimationFrame(() => {
      textareaRefs.current.forEach((textarea, rowId) => {
        applyStoredHeight(rowId, textarea);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [currentPage]);


  function header() {
    return (
      <header
        style={{
          fontSize: '12px',
          fontWeight: 600,
          paddingBottom: '4px',
          borderBottom: '1px solid #d4d4d8',
          width: '100%',
        }}
      >
        <div>가변 행 높이 테스트 서식</div>
        <div style={{ fontWeight: 400, fontSize: '11px' }}>
          테이블 행 높이가 일정하지 않은 경우 페이지 계산 검증
        </div>
      </header>
    );
  }

  function footer() {
    return (
      <footer
        style={{
          fontSize: '11px',
          borderTop: '1px solid #d4d4d8',
          paddingTop: '4px',
          width: '100%',
          position: 'relative',
          height: '18px',
        }}
      >
        <span style={{ position: 'absolute', left: 0, top: '5px' }}>
          테스트 서식 · 페이지 계산 검증
        </span>
        <span style={{ position: 'absolute', right: 0, top: '5px' }}>TEST</span>
      </footer>
    );
  }

  const allDescriptions = formValues.rows.map((row) => row.description);

  return (
    <div className="flex flex-col flex-1 gap-6 p-6">
      <PrintableDocument
        paper={PAPER_SIZES.A4}
        margin={{ top: margin, bottom: margin, left: margin, right: margin }}
        header={header}
        footer={footer}
        sectionSpacing={4}
        observeDependencies={[margin, allDescriptions]}
        onPageCountChange={setTotalPages}
      >
        <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700 }}>가변 행 높이 테스트</h1>
          <p style={{ fontSize: '12px', color: '#475569' }}>
            이 서식은 테이블 행 높이가 일정하지 않은 경우에도 페이지 계산이 올바르게 작동하는지
            검증하기 위한 테스트 서식입니다.
          </p>
        </section>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginTop: '8px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  width: '15%',
                }}
              >
                항목
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  width: '85%',
                }}
              >
                설명 (textarea - 가변 높이)
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const row = formValues.rows[index];
              const rowId = row?.id || field.id;
              return (
                <tr key={field.id}>
                  <td
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #e2e8f0',
                      verticalAlign: 'top',
                    }}
                  >
                    {row?.title || `항목 ${index + 1}`}
                  </td>
                  <td
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div className="printable-textarea-wrapper">
                      <div
                        className="printable-textarea-display printable-only whitespace-pre-wrap break-words text-[11px] leading-snug text-slate-900 border border-slate-200 px-2 py-1 rounded-sm"
                        style={{
                          height: heightRef.current.get(rowId)
                            ? `${heightRef.current.get(rowId)}px`
                            : 'auto',
                        }}
                      >
                        {row?.description || '\u00A0'}
                      </div>
                      <Controller
                        name={`rows.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <textarea
                            {...field}
                            ref={(el) => {
                              // register의 ref와 우리 ref 병합
                              field.ref(el);
                              if (el) {
                                textareaRefs.current.set(rowId, el);
                                // ref가 설정될 때 높이 측정
                                requestAnimationFrame(() => {
                                  measureTextarea(rowId, el);
                                });
                              } else {
                                textareaRefs.current.delete(rowId);
                                heightRef.current.delete(rowId);
                              }
                            }}
                            onChange={(e) => {
                              field.onChange(e);
                              // 높이 재측정
                              requestAnimationFrame(() => {
                                const textarea = e.target as HTMLTextAreaElement;
                                if (textarea) {
                                  measureTextarea(rowId, textarea);
                                }
                              });
                            }}
                            className={textareaClassName}
                            rows={1}
                            onInput={(event) => {
                              const textarea = event.currentTarget as HTMLTextAreaElement;
                              measureTextarea(rowId, textarea);
                            }}
                          />
                        )}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <section style={{ fontSize: '11px', lineHeight: 1.5, marginTop: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>테스트 가이드</h2>
          <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
            <li>각 행의 textarea에 긴 텍스트를 입력하여 행 높이를 증가시켜보세요.</li>
            <li>텍스트를 삭제하여 행 높이를 감소시켜보세요.</li>
            <li>여러 행의 텍스트를 동시에 변경하여 페이지 계산이 정확한지 확인하세요.</li>
          </ul>
        </section>
      </PrintableDocument>
    </div>
  );
}

function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}